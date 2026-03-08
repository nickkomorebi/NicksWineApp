import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage, winePhotoKey } from "@/lib/storage";
import { inngest } from "@/inngest/client";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photos = formData.getAll("photos") as File[];
    const tripId = formData.get("tripId") as string | null;

    if (!photos.length || photos.length > 8) {
      return NextResponse.json(
        { error: "1–8 photos required" },
        { status: 400 }
      );
    }

    const batchId = randomUUID();

    // Upload all photos in parallel
    const items = await Promise.all(
      photos.map(async (photo) => {
        const filename = `${randomUUID()}.jpg`;
        const key = winePhotoKey(batchId, filename);

        const arrayBuffer = await photo.arrayBuffer();
        const rawBuffer = Buffer.from(arrayBuffer);

        // Convert to JPEG (handles HEIC, AVIF, WebP, PNG, etc.)
        // Resize to max 2048px on longest side to keep Claude payloads reasonable
        const buffer = await sharp(rawBuffer)
          .rotate() // auto-orient based on EXIF
          .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 88 })
          .toBuffer();

        let url: string;
        try {
          await storage.upload(key, buffer, "image/jpeg");
          url = storage.getUrl(key);
        } catch {
          url = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        }

        return { key, url };
      })
    );

    // Create batch + items in DB
    const batch = await prisma.uploadBatch.create({
      data: {
        id: batchId,
        status: "PROCESSING",
        totalPhotos: photos.length,
        tripId: tripId || undefined,
        items: {
          create: items.map(({ key, url }) => ({
            storageKey: key,
            url,
            status: "PENDING",
          })),
        },
      },
      include: { items: true },
    });

    // Fire Inngest vision extraction for each item
    await Promise.all(
      batch.items.map((item) =>
        inngest.send({
          name: "wine/vision.extract",
          data: { itemId: item.id, batchId },
        })
      )
    );

    return NextResponse.json({
      batchId,
      items: batch.items.map((i) => ({ id: i.id, url: i.url })),
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

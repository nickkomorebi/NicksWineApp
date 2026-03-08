import { NextRequest, NextResponse } from "next/server";
import { storage, tripPhotoKey } from "@/lib/storage";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get("photo") as File | null;
    const tripId = (formData.get("tripId") as string | null) ?? randomUUID();

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const arrayBuffer = await photo.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    const buffer = await sharp(rawBuffer)
      .rotate()
      .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const filename = `${randomUUID()}.jpg`;
    const key = tripPhotoKey(tripId, filename);

    await storage.upload(key, buffer, "image/jpeg");
    const url = storage.getUrl(key);

    return NextResponse.json({ url, storageKey: key });
  } catch (err) {
    console.error("Trip photo upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

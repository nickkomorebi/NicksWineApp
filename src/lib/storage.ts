/**
 * Abstract StorageProvider interface.
 * Current implementation: Supabase Storage.
 * To swap: implement this interface with S3, R2, or local filesystem,
 * then update the `storage` export below.
 */

export interface StorageProvider {
  upload(key: string, file: Buffer | Blob, contentType: string): Promise<string>;
  getUrl(key: string): string;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

class SupabaseStorageProvider implements StorageProvider {
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  }

  async upload(key: string, file: Buffer | Blob, contentType: string): Promise<string> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(this.supabaseUrl, this.serviceRoleKey);

    const [bucket, ...pathParts] = key.split("/");
    const path = pathParts.join("/");

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return key;
  }

  getUrl(key: string): string {
    const [bucket, ...pathParts] = key.split("/");
    const path = pathParts.join("/");
    return `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(this.supabaseUrl, this.serviceRoleKey);

    const [bucket, ...pathParts] = key.split("/");
    const path = pathParts.join("/");

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(this.supabaseUrl, this.serviceRoleKey);

    const [bucket, ...pathParts] = key.split("/");
    const path = pathParts.join("/");

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(`Storage delete failed: ${error.message}`);
  }
}

export const storage: StorageProvider = new SupabaseStorageProvider();

// Bucket constants
export const BUCKETS = {
  WINE_PHOTOS: "wine-photos",
  TASTING_AUDIO: "tasting-audio",
} as const;

export function winePhotoKey(batchId: string, filename: string) {
  return `${BUCKETS.WINE_PHOTOS}/batches/${batchId}/${filename}`;
}

export function tastingAudioKey(tastingId: string, filename: string) {
  return `${BUCKETS.TASTING_AUDIO}/${tastingId}/${filename}`;
}

export function tripPhotoKey(tripId: string, filename: string) {
  return `${BUCKETS.WINE_PHOTOS}/trips/${tripId}/${filename}`;
}

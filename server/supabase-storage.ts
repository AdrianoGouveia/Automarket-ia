import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { nanoid } from "nanoid";

// Initialize Supabase client
const supabaseUrl = process.env.PROJECT_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("[Supabase Storage] Missing PROJECT_URL/VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = "car-photos";

/**
 * Initialize storage bucket if it doesn't exist
 * Note: Bucket must be created manually in Supabase dashboard due to RLS policies
 */
export async function initializeBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.warn(
        `[Supabase Storage] Bucket '${BUCKET_NAME}' not found. Please create it manually in Supabase dashboard with public access enabled.`
      );
    } else {
      console.log(`[Supabase Storage] Bucket '${BUCKET_NAME}' is ready`);
    }
  } catch (error) {
    console.error("[Supabase Storage] Initialization error:", error);
  }
}

/**
 * Process image into multiple sizes (thumbnail, medium, large)
 */
async function processImage(buffer: Buffer) {
  const [thumbnail, medium, large] = await Promise.all([
    sharp(buffer)
      .resize(300, 200, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer(),
    sharp(buffer)
      .resize(800, 600, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer(),
    sharp(buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer(),
  ]);

  return { thumbnail, medium, large };
}

/**
 * Upload a car photo with automatic processing into multiple sizes
 */
export async function uploadCarPhoto(
  carId: number,
  imageBuffer: Buffer,
  userId: number
): Promise<{
  urls: {
    thumb: string;
    medium: string;
    large: string;
  };
  paths: {
    thumb: string;
    medium: string;
    large: string;
  };
}> {
  const fileId = nanoid(10);
  const timestamp = Date.now();

  // Process image into different sizes
  const { thumbnail, medium, large } = await processImage(imageBuffer);

  // Generate paths
  const basePath = `${userId}/${carId}`;
  const paths = {
    thumb: `${basePath}/thumb_${fileId}_${timestamp}.jpg`,
    medium: `${basePath}/medium_${fileId}_${timestamp}.jpg`,
    large: `${basePath}/large_${fileId}_${timestamp}.jpg`,
  };

  // Upload all sizes
  const uploads = await Promise.all([
    supabase.storage.from(BUCKET_NAME).upload(paths.thumb, thumbnail, {
      contentType: "image/jpeg",
      cacheControl: "31536000", // 1 year
    }),
    supabase.storage.from(BUCKET_NAME).upload(paths.medium, medium, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
    }),
    supabase.storage.from(BUCKET_NAME).upload(paths.large, large, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
    }),
  ]);

  // Check for errors
  const errors = uploads.filter((u) => u.error);
  if (errors.length > 0) {
    throw new Error(`Failed to upload images: ${errors.map((e) => e.error?.message).join(", ")}`);
  }

  // Get public URLs
  const urls = {
    thumb: supabase.storage.from(BUCKET_NAME).getPublicUrl(paths.thumb).data.publicUrl,
    medium: supabase.storage.from(BUCKET_NAME).getPublicUrl(paths.medium).data.publicUrl,
    large: supabase.storage.from(BUCKET_NAME).getPublicUrl(paths.large).data.publicUrl,
  };

  return { urls, paths };
}

/**
 * Delete a car photo (all sizes)
 */
export async function deleteCarPhoto(paths: {
  thumb: string;
  medium: string;
  large: string;
}): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([paths.thumb, paths.medium, paths.large]);

  if (error) {
    throw new Error(`Failed to delete images: ${error.message}`);
  }
}

/**
 * Delete all photos for a car
 */
export async function deleteAllCarPhotos(userId: number, carId: number): Promise<void> {
  const prefix = `${userId}/${carId}/`;

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${userId}/${carId}`);

  if (listError) {
    throw new Error(`Failed to list images: ${listError.message}`);
  }

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${prefix}${f.name}`);
    const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete images: ${deleteError.message}`);
    }
  }
}

// Initialize bucket on module load
initializeBucket();

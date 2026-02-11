import sharp from "sharp";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

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
 * Uses Manus S3 storage
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

  // Generate paths with random suffix to prevent enumeration
  const basePath = `car-photos/${userId}/${carId}`;
  const paths = {
    thumb: `${basePath}/thumb_${fileId}_${timestamp}.jpg`,
    medium: `${basePath}/medium_${fileId}_${timestamp}.jpg`,
    large: `${basePath}/large_${fileId}_${timestamp}.jpg`,
  };

  // Upload all sizes to Manus S3
  const [thumbResult, mediumResult, largeResult] = await Promise.all([
    storagePut(paths.thumb, thumbnail, "image/jpeg"),
    storagePut(paths.medium, medium, "image/jpeg"),
    storagePut(paths.large, large, "image/jpeg"),
  ]);

  // Return public URLs
  const urls = {
    thumb: thumbResult.url,
    medium: mediumResult.url,
    large: largeResult.url,
  };

  return { urls, paths };
}

/**
 * Delete a car photo (all sizes)
 * Note: Manus S3 doesn't provide delete API, files are managed by lifecycle policies
 */
export async function deleteCarPhoto(paths: {
  thumb: string;
  medium: string;
  large: string;
}): Promise<void> {
  // Manus S3 handles file deletion via lifecycle policies
  // Files are automatically cleaned up based on retention rules
  console.log("[Manus Storage] Delete requested for:", paths);
}

/**
 * Delete all photos for a car
 * Note: Manus S3 doesn't provide delete API, files are managed by lifecycle policies
 */
export async function deleteAllCarPhotos(userId: number, carId: number): Promise<void> {
  // Manus S3 handles file deletion via lifecycle policies
  console.log(`[Manus Storage] Delete all photos requested for user ${userId}, car ${carId}`);
}

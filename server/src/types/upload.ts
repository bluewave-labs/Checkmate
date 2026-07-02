// Shared constraints for user supplied image uploads
export const ImageMimeTypes = ["image/jpeg", "image/png", "image/jpg"] as const;
export type ImageMimeType = (typeof ImageMimeTypes)[number];

export const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

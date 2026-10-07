import multer from "multer";
import { AppError } from "@/utils/AppError.js";
import { middlewareErrors } from "@/api/middleware/middleware.errors.js";
import { ImageMimeTypes, MAX_IMAGE_SIZE_BYTES } from "@/types/upload.js";

const SERVICE_NAME = "uploadMiddleware";

// Reusable multer instance for handling image uploads
const imageUpload = multer({
	limits: {
		fileSize: MAX_IMAGE_SIZE_BYTES,
		files: 1,
	},
	fileFilter: (_req, file, cb) => {
		if (!(ImageMimeTypes as readonly string[]).includes(file.mimetype)) {
			cb(
				new AppError(middlewareErrors.unsupportedFileType, {
					message: "File must be a valid image (jpeg, jpg, or png)",
					service: SERVICE_NAME,
					method: "fileFilter",
				})
			);
			return;
		}
		cb(null, true);
	},
});

export { imageUpload };

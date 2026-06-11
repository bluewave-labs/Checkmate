import multer from "multer";
import { AppError } from "@/utils/AppError.js";
import { ImageMimeTypes, MAX_IMAGE_SIZE_BYTES } from "@/types/upload.js";

// Reusable multer instance for handling image uploads
const imageUpload = multer({
	limits: {
		fileSize: MAX_IMAGE_SIZE_BYTES,
		files: 1,
	},
	fileFilter: (_req, file, cb) => {
		if (!(ImageMimeTypes as readonly string[]).includes(file.mimetype)) {
			cb(
				new AppError({
					status: 415,
					message: "File must be a valid image (jpeg, jpg, or png)",
					service: "uploadMiddleware",
					method: "fileFilter",
				})
			);
			return;
		}
		cb(null, true);
	},
});

export { imageUpload };

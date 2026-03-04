import type { User } from "@/types/index.js";

declare global {
	namespace Express {
		interface Request {
			file?: Multer.File;
			user?: User | undefined;
			resource?: unknown;
		}
	}
}

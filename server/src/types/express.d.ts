import type { User } from "@/domain/users/user.type.js";

declare global {
	namespace Express {
		interface Request {
			file?: Multer.File;
			user?: User | undefined;
			resource?: unknown;
		}
	}
}

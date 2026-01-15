import { ITokenizedUser } from "../db/models/index.ts";

declare global {
	namespace Express {
		interface Request {
			file?: Multer.File;
			user?: ITokenizedUser;
			resource?: any;
		}
	}
}

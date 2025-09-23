import { ITokenizedUser } from "../db/models/index.ts";

declare global {
	namespace Express {
		interface Request {
			user?: ITokenizedUser;
			resource?: any;
		}
	}
}

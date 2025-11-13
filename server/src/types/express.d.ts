import { IUserContext } from "../db/models/index.ts";

declare global {
  namespace Express {
    interface Request {
      user?: IUserContext;
      resource?: any;
      validatedQuery: Record<string, any>;
    }
  }
}

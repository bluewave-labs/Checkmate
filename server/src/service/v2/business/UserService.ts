import { IUser, User } from "../../../db/v2/models/index.js";

const SERVICE_NAME = "UserServiceV2";
export interface IUserService {
	getAllUsers(): Promise<IUser[]>;
}

class UserService implements IUserService {
	static SERVICE_NAME = SERVICE_NAME;
	async getAllUsers(): Promise<IUser[]> {
		return await User.find();
	}
}

export default UserService;

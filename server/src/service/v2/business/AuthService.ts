import bcrypt from "bcryptjs";
import { User, Role, ITokenizedUser } from "../../../db/models/index.js";
import ApiError from "../../../utils/ApiError.js";
import { Types } from "mongoose";

export const PERMISSIONS = {
	users: {
		all: "users.*",
		create: "users.create",
		view: "users.view",
		update: "users.update",
		delete: "users.delete",
	},

	monitors: {
		all: "monitors.*",
		create: "monitors.create",
		view: "monitors.view",
		update: "monitors.update",
		delete: "monitors.delete",
	},
	notifications: {
		all: "notifications.*",
		create: "notifications.create",
		view: "notifications.view",
		update: "notifications.update",
		delete: "notifications.delete",
	},
	checks: {
		all: "checks.*",
		create: "checks.create",
		view: "checks.view",
		update: "checks.update",
		delete: "checks.delete",
	},
	statusPages: {
		all: "statusPages.*",
		create: "statusPages.create",
		view: "statusPages.view",
		update: "statusPages.update",
		delete: "statusPages.delete",
	},
};

export const DEFAULT_ROLES = [
	{
		name: "SuperAdmin",
		description: "Super admin with all permissions",
		permissions: ["*"],
		isSystem: true,
	},
	{
		name: "Admin",
		description: "Admin with full permissions",
		permissions: [PERMISSIONS.monitors.all, PERMISSIONS.users.all],
		isSystem: true,
	},
	{
		name: "Manager",
		description: "Can manage users",
		permissions: [PERMISSIONS.users.create, PERMISSIONS.users.update, PERMISSIONS.monitors.all],
		isSystem: true,
	},
	{
		name: "Member",
		description: "Basic team member",
		permissions: [PERMISSIONS.users.update, PERMISSIONS.monitors.create, PERMISSIONS.monitors.view, PERMISSIONS.monitors.update],
		isSystem: true,
	},
];

export type RegisterData = {
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	roles?: Types.ObjectId[]; // Optional roles for invite-based registration
};

export type LoginData = {
	email: string;
	password: string;
};

export type AuthResult = ITokenizedUser;

export interface IAuthService {
	register(signupData: RegisterData): Promise<ITokenizedUser>;
	registerWithInvite(signupData: RegisterData): Promise<ITokenizedUser>;
	login(loginData: LoginData): Promise<ITokenizedUser>;
}

class AuthService implements IAuthService {
	constructor() {}

	async register(signupData: RegisterData): Promise<ITokenizedUser> {
		const userCount = await User.countDocuments();

		if (userCount > 0) {
			throw new Error("Registration is closed. Please request an invite.");
		}

		const { email, firstName, lastName, password } = signupData;

		// Create all default roles
		const rolePromises = DEFAULT_ROLES.map((roleData) =>
			new Role({
				...roleData,
			}).save()
		);
		const roles = await Promise.all(rolePromises);

		// Find admin role and assign to first user
		const superAdminRole = roles.find((role) => role.name === "SuperAdmin");

		const user = new User({
			email,
			firstName,
			lastName,
			password,
			roles: [superAdminRole!._id],
		});

		const savedUser = await user.save();
		return {
			sub: savedUser._id.toString(),
			roles: savedUser.roles.map((role) => role.toString()),
		};
	}

	async registerWithInvite(signupData: RegisterData): Promise<ITokenizedUser> {
		const { email, firstName, lastName, password, roles } = signupData;

		const user = new User({
			email,
			firstName,
			lastName,
			password,
			roles: roles || [],
		});
		try {
			const savedUser = await user.save();
			return {
				sub: savedUser._id.toString(),
				roles: savedUser.roles.map((role) => role.toString()),
			};
		} catch (error: any) {
			if (error?.code === 11000) {
				const dupError = new ApiError("Email already in use", 409);
				dupError.stack = error?.stack;
				throw dupError;
			}
			throw error;
		}
	}

	async login(loginData: LoginData): Promise<ITokenizedUser> {
		const { email, password } = loginData;

		// Find user by email
		const user = await User.findOne({ email });

		if (!user) {
			throw new Error("Invalid email or password");
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new Error("Invalid email or password");
		}

		return {
			sub: user._id.toString(),
			roles: user.roles.map((role) => role.toString()),
		};
	}
}

export default AuthService;

import { Request, Response, NextFunction } from "express";
import { encode, decode } from "../../utils/JWTUtils.js";
import AuthService from "../../service/v2/business/AuthService.js";
import ApiError from "../../utils/ApiError.js";
import InviteService from "../../service/v2/business/InviteService.js";
import { IInvite } from "../../db/v2/models/index.js";

class AuthController {
	private authService: AuthService;
	private inviteService: InviteService;
	constructor(authService: AuthService, inviteService: InviteService) {
		this.authService = authService;
		this.inviteService = inviteService;
	}

	register = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, firstName, lastName, password } = req.body;

			if (!email || !firstName || !lastName || !password) {
				throw new Error("Email, firstName, lastName, and password are required");
			}

			const result = await this.authService.register({
				email,
				firstName,
				lastName,
				password,
			});

			const token = encode(result);

			res.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
			});

			res.status(201).json({
				message: "User created successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	registerWithInvite = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.params.token;
			if (!token) {
				throw new ApiError("Invite token is required", 400);
			}

			const invite: IInvite = await this.inviteService.get(token);

			const { firstName, lastName, password } = req.body;
			const email = invite?.email;
			const roles = invite?.roles;

			if (!email || !firstName || !lastName || !password || !roles || roles.length === 0) {
				throw new Error("Email, firstName, lastName, password, and roles are required");
			}

			const result = await this.authService.registerWithInvite({
				email,
				firstName,
				lastName,
				password,
				roles,
			});

			if (!result) {
				throw new Error("Registration failed");
			}

			await this.inviteService.delete(invite._id.toString());

			const jwt = encode(result);

			res.cookie("token", jwt, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
			});

			res.status(201).json({ message: "User created successfully" });
		} catch (error) {
			next(error);
		}
	};

	login = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body;
			// Validation
			if (!email || !password) {
				return res.status(400).json({ message: "Email and password are required" });
			}
			const result = await this.authService.login({ email, password });

			const token = encode(result);

			res.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
			});

			res.status(200).json({
				message: "Login successful",
			});
		} catch (error) {
			next(error);
		}
	};

	logout = (req: Request, res: Response) => {
		res.clearCookie("token", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});
		res.status(200).json({ message: "Logout successful" });
	};

	me = (req: Request, res: Response, next: NextFunction) => {
		return res.status(200).json({ message: "OK" });
	};

	cleanup = async (req: Request, res: Response) => {
		try {
			await this.authService.cleanup();
			res.status(200).json({ message: "Cleanup successful" });
		} catch (error) {}
	};

	cleanMonitors = async (req: Request, res: Response) => {
		try {
			await this.authService.cleanMonitors();
			res.status(200).json({ message: "Monitors cleanup successful" });
		} catch (error) {
			res.status(500).json({ message: "Internal server error" });
		}
	};
}

export default AuthController;

import jwt from "jsonwebtoken";
import { AuthResult } from "../service/v2/business/AuthService.js";

const encode = (data: AuthResult): string => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not defined");
	}
	const token = jwt.sign(data, secret, { expiresIn: "99d" });
	return token;
};

const decode = (token: string): AuthResult => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not defined");
	}
	const decoded = jwt.verify(token, secret) as AuthResult;
	return decoded;
};

export { encode, decode };

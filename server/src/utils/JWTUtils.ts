import jwt from "jsonwebtoken";
import { AuthResult } from "@/services/business/AuthService.js";
import { IUserContext } from "@/db/models/index.js";
import bcrypt from "bcryptjs";

export const encode = (data: AuthResult): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token = jwt.sign(data, secret, { expiresIn: "99d" });
  return token;
};

export const decode = (token: string): IUserContext => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  const decoded = jwt.verify(token, secret) as IUserContext;
  return decoded;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

export const compareHash = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

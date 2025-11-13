import dotenv from "dotenv";

export interface IEnvConfig {
  NODE_ENV: string;
  LOG_LEVEL: string;
  ORIGIN: string;
  JWT_SECRET: string;
  PORT: number;
  PAGESPEED_API_KEY: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
}

dotenv.config();

export const config: IEnvConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  ORIGIN: process.env.ORIGIN || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  PAGESPEED_API_KEY: process.env.PAGESPEED_API_KEY || "",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.example.com",
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_USER: process.env.SMTP_USER || "user@example.com",
  SMTP_PASS: process.env.SMTP_PASS || "your_smtp_password",
};

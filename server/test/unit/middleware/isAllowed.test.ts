import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { isAllowed } from "../../../src/api/middleware/isAllowed.ts";
import { AppError } from "../../../src/utils/AppError.ts";

describe("isAllowed middleware", () => {
	it("calls next() without error when user has an allowed role", () => {
		const middleware = isAllowed(["admin", "superadmin"]);
		const req = {
			user: {
				id: "user-1",
				teamId: "team-1",
				email: "admin@example.com",
				role: ["admin"],
			},
		} as unknown as Request;
		const res = {} as Response;
		const next = jest.fn() as unknown as NextFunction;

		middleware(req, res, next);

		expect(next).toHaveBeenCalledWith();
	});

	it("calls next(error) with 403 when user does not have an allowed role", () => {
		const middleware = isAllowed(["admin", "superadmin"]);
		const req = {
			user: {
				id: "user-2",
				teamId: "team-1",
				email: "user@example.com",
				role: ["user"],
			},
		} as unknown as Request;
		const res = {} as Response;
		const next = jest.fn() as unknown as NextFunction;

		middleware(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const error = (next as unknown as jest.Mock).mock.calls[0][0] as AppError;
		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(403);
		expect(error.message).toBe("Unauthorized");
	});

	it("calls next(error) with 403 when req.user is undefined", () => {
		const middleware = isAllowed(["admin", "superadmin"]);
		const req = {} as Request;
		const res = {} as Response;
		const next = jest.fn() as unknown as NextFunction;

		middleware(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const error = (next as unknown as jest.Mock).mock.calls[0][0] as AppError;
		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(403);
		expect(error.message).toBe("Unauthorized");
	});

	it("calls next() when user has multiple roles and at least one matches", () => {
		const middleware = isAllowed(["admin", "superadmin"]);
		const req = {
			user: {
				id: "user-3",
				teamId: "team-1",
				email: "multi@example.com",
				role: ["user", "admin"],
			},
		} as unknown as Request;
		const res = {} as Response;
		const next = jest.fn() as unknown as NextFunction;

		middleware(req, res, next);

		expect(next).toHaveBeenCalledWith();
	});
});

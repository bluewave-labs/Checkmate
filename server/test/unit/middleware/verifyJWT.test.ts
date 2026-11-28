import { describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { createVerifyJWT } from "../../../src/api/middleware/verifyJWT.ts";
import { middlewareErrors } from "../../../src/api/middleware/middleware.errors.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import type { IAuthStateService } from "../../../src/domain/users/auth-state.service.ts";

const SECRET = "test-secret";

const setup = (isTokenCurrent: () => Promise<boolean> = async () => true) => {
	const settingsService = { getSettings: jest.fn().mockReturnValue({ jwtSecret: SECRET }) } as unknown as ISettingsService;
	const authStateService = {
		isTokenCurrent: jest.fn<IAuthStateService["isTokenCurrent"]>().mockImplementation(isTokenCurrent),
		revokeTokens: jest.fn<IAuthStateService["revokeTokens"]>(),
	};
	const verifyJWT = createVerifyJWT(settingsService, authStateService);
	const token = jwt.sign({ id: "user-1", teamId: "team-1", role: ["user"] }, SECRET);
	const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
	const next = jest.fn<NextFunction>();
	const done = new Promise<void>((resolve) => {
		next.mockImplementation(() => resolve());
	});
	return { verifyJWT, authStateService, req, next, done };
};

describe("verifyJWT", () => {
	it("calls next with no error for a current token", async () => {
		const { verifyJWT, authStateService, req, next, done } = setup();
		verifyJWT(req, {} as Response, next);
		await done;
		expect(next).toHaveBeenCalledWith();
		expect(req.user).toEqual(expect.objectContaining({ id: "user-1" }));
		expect(authStateService.isTokenCurrent).toHaveBeenCalledWith("user-1", expect.any(Number));
	});

	it("responds unauthenticated when the token is no longer current", async () => {
		const { verifyJWT, req, next, done } = setup(async () => false);
		verifyJWT(req, {} as Response, next);
		await done;
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ definition: middlewareErrors.unauthenticated, message: "Session is no longer valid" })
		);
		expect(req.user).toBeUndefined();
	});

	it("passes repository errors to next", async () => {
		const failure = new Error("db down");
		const { verifyJWT, req, next, done } = setup(async () => {
			throw failure;
		});
		verifyJWT(req, {} as Response, next);
		await done;
		expect(next).toHaveBeenCalledWith(failure);
	});
});

import { describe, expect, it } from "@jest/globals";
import type { Request } from "express";
import { imageUpload } from "../../../src/api/middleware/upload.ts";
import { MAX_IMAGE_SIZE_BYTES } from "../../../src/types/upload.ts";
import { AppError } from "../../../src/utils/AppError.ts";

// Reaches into the multer instance config to exercise the fileFilter/limits in isolation.
// Guards against regressing GHSA-9xvg-x28f-m78m (pre-auth DoS via unbounded uploads).
const config = (imageUpload as unknown as { fileFilter: Function; limits: { fileSize: number; files: number } });

const makeFile = (mimetype: string): Express.Multer.File =>
	({ fieldname: "profileImage", originalname: "x", mimetype }) as Express.Multer.File;

const runFilter = (mimetype: string): Promise<{ error: unknown; accepted: unknown }> =>
	new Promise((resolve) => {
		config.fileFilter({} as Request, makeFile(mimetype), (error: unknown, accepted: unknown) => resolve({ error, accepted }));
	});

describe("imageUpload middleware", () => {
	it("enforces a file size limit so large uploads cannot exhaust memory", () => {
		expect(config.limits.fileSize).toBe(MAX_IMAGE_SIZE_BYTES);
		expect(config.limits.fileSize).toBeLessThanOrEqual(3 * 1024 * 1024);
	});

	it("limits a request to a single file", () => {
		expect(config.limits.files).toBe(1);
	});

	it("accepts allowed image mime types", async () => {
		for (const mimetype of ["image/jpeg", "image/png", "image/jpg"]) {
			const { error, accepted } = await runFilter(mimetype);
			expect(error).toBeNull();
			expect(accepted).toBe(true);
		}
	});

	it("rejects non-image uploads with a 415 AppError", async () => {
		const { error } = await runFilter("application/octet-stream");
		expect(error).toBeInstanceOf(AppError);
		expect((error as AppError).status).toBe(415);
	});
});

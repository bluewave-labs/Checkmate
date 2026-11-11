import { describe, expect, it, jest } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { ConnectApiService } from "../../../src/domain/connect/connect-api.service.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import type { ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const TOKEN = `cmk_${"a".repeat(48)}`;
const API = "https://connect.checkmate.so";
const BLOB = "https://store.private.blob.vercel-storage.com/backups/x.cmkb";

const enrollment = (overrides: Partial<ConnectEnrollment> = {}): ConnectEnrollment => ({
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "inst-1",
	token: TOKEN,
	apiUrl: API,
	...overrides,
});

const json = (statusCode: number, body: unknown) => ({
	statusCode,
	body: JSON.stringify(body),
});

const drain = async (body: AsyncIterable<Buffer>) => {
	let bytes = 0;
	for await (const chunk of body) bytes += chunk.length;
	return bytes;
};

const setup = (
	opts: {
		connectApiUrl?: string | null;
		post?: jest.Mock<any>;
		get?: jest.Mock<any>;
		put?: jest.Mock<any>;
		stream?: jest.Mock<any>;
	} = {}
) => {
	const logger = createMockLogger();
	const got = {
		post: opts.post ?? jest.fn<any>().mockResolvedValue(json(200, {})),
		get: opts.get ?? jest.fn<any>().mockResolvedValue(json(200, { backups: [] })),
		put:
			opts.put ??
			jest.fn<any>(async (_url: string, options: any) => {
				await drain(options.body);
				return { statusCode: 200, body: "" };
			}),
		stream: opts.stream ?? jest.fn<any>(),
	};
	const settingsService = {
		getSettings: () => ({ connectApiUrl: opts.connectApiUrl ?? null }),
	} as unknown as ISettingsService;
	const connectApiService = new ConnectApiService(got as any, settingsService, logger as any);
	return { connectApiService, got, logger };
};

const withFile = async (bytes: number, work: (file: string) => Promise<void>) => {
	const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "connect-upload-"));
	try {
		const file = path.join(dir, "backup.cmkb");
		await fs.promises.writeFile(file, Buffer.alloc(bytes, 1));
		await work(file);
	} finally {
		await fs.promises.rm(dir, { recursive: true, force: true });
	}
};

const upload = {
	kind: "full" as const,
	sizeBytes: 10,
	sha256: "ab".repeat(32),
	keyId: "cd".repeat(16),
};

describe("ConnectApiService.requestUpload", () => {
	it("posts the upload to the API with the bearer token and no redirects", async () => {
		const post = jest.fn<any>().mockResolvedValue(json(200, { uploadUrl: BLOB, backupId: "b-1" }));
		const { connectApiService } = setup({ post });

		await expect(connectApiService.requestUpload(enrollment(), upload)).resolves.toEqual({ uploadUrl: BLOB, backupId: "b-1" });

		const [url, options] = post.mock.calls[0] as [string, any];
		expect(url).toBe(`${API}/api/agent/backups/request-upload`);
		expect(options.json).toEqual({ agentId: "inst-1", ...upload });
		expect(options.headers.authorization).toBe(`Bearer ${TOKEN}`);
		expect(options.followRedirect).toBe(false);
		expect(options.throwHttpErrors).toBe(false);
		expect(options.retry).toEqual({ limit: 0 });
		expect(options.timeout).toEqual({ request: 15_000 });
	});

	it.each([
		["CONNECT_API_URL first", { connectApiUrl: "https://self.example" }, enrollment(), "https://self.example"],
		["then the enrollment's API URL", {}, enrollment(), API],
		["then the tunnel host", {}, enrollment({ apiUrl: null }), "https://relay.checkmate.so"],
	])("uses %s as the API base", async (_label, opts, enrolled, base) => {
		const post = jest.fn<any>().mockResolvedValue(json(200, { uploadUrl: BLOB, backupId: "b-1" }));
		const { connectApiService } = setup({ ...opts, post });

		await connectApiService.requestUpload(enrolled, upload);

		expect((post.mock.calls[0] as [string])[0]).toBe(`${base}/api/agent/backups/request-upload`);
	});

	it("surfaces the Connect API's error text", async () => {
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(json(402, { error: "Backup quota reached" })),
		});

		await expect(connectApiService.requestUpload(enrollment(), upload)).rejects.toThrow("Backup quota reached");
	});

	it("falls back to the status when the body has no error text", async () => {
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue({ statusCode: 503, body: "<html>" }),
		});

		await expect(connectApiService.requestUpload(enrollment(), upload)).rejects.toThrow("Checkmate Connect responded 503");
	});

	it("fails on a redirect instead of following it", async () => {
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue({ statusCode: 302, body: "" }),
		});

		await expect(connectApiService.requestUpload(enrollment(), upload)).rejects.toThrow("Checkmate Connect responded 302");
	});

	it("rejects a response without the ticket fields", async () => {
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(json(200, { backupId: "b-1" })),
		});

		await expect(connectApiService.requestUpload(enrollment(), upload)).rejects.toThrow("Checkmate Connect returned an unexpected response");
	});
});

describe("ConnectApiService.complete and abandon", () => {
	it("completes the upload", async () => {
		const post = jest.fn<any>().mockResolvedValue(json(200, { status: "verified" }));
		const { connectApiService } = setup({ post });

		await expect(connectApiService.complete(enrollment(), "b-1")).resolves.toBeUndefined();
		expect((post.mock.calls[0] as [string])[0]).toBe(`${API}/api/agent/backups/b-1/complete`);
	});

	it("releases a slot", async () => {
		const post = jest.fn<any>().mockResolvedValue(json(200, {}));
		const { connectApiService } = setup({ post });

		await connectApiService.abandon(enrollment(), "b-1");

		expect((post.mock.calls[0] as [string])[0]).toBe(`${API}/api/agent/backups/b-1/abandon`);
	});

	it("never throws when the release fails, and warns", async () => {
		const { connectApiService, logger } = setup({
			post: jest.fn<any>().mockRejectedValue(new Error("network down")),
		});

		await expect(connectApiService.abandon(enrollment(), "b-1")).resolves.toBeUndefined();
		expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error), backupId: "b-1" }, "Connect could not release the failed upload");
	});
});

describe("ConnectApiService.list", () => {
	it("lists this agent's backups", async () => {
		const backups = [
			{
				id: "b-1",
				kind: "full",
				sizeBytes: 10,
				status: "verified",
				createdAt: "2026-11-11T10:00:00.000Z",
				keyId: "k",
			},
		];
		const get = jest.fn<any>().mockResolvedValue(json(200, { backups }));
		const { connectApiService } = setup({ get });

		await expect(connectApiService.list(enrollment())).resolves.toEqual(backups);

		const [url, options] = get.mock.calls[0] as [string, any];
		expect(url).toBe(`${API}/api/agent/backups`);
		expect(options.searchParams).toEqual({ agentId: "inst-1" });
		expect(options.headers.authorization).toBe(`Bearer ${TOKEN}`);
		expect(options.followRedirect).toBe(false);
	});

	it("treats a missing list as empty", async () => {
		const { connectApiService } = setup({
			get: jest.fn<any>().mockResolvedValue(json(200, {})),
		});

		await expect(connectApiService.list(enrollment())).resolves.toEqual([]);
	});

	it("surfaces a list failure", async () => {
		const { connectApiService } = setup({
			get: jest.fn<any>().mockResolvedValue(json(401, { error: "credential revoked" })),
		});

		await expect(connectApiService.list(enrollment())).rejects.toThrow("credential revoked");
	});
});

describe("ConnectApiService.upload", () => {
	it("streams the file with its length and reports progress up to 100", async () => {
		await withFile(300_000, async (file) => {
			let sent = 0;
			const put = jest.fn<any>(async (_url: string, options: any) => {
				sent = await drain(options.body);
				return { statusCode: 200, body: "" };
			});
			const { connectApiService } = setup({ put });
			const percents: number[] = [];

			await connectApiService.upload(BLOB, file, 300_000, (percent) => percents.push(percent));

			const [url, options] = put.mock.calls[0] as [string, any];
			expect(url).toBe(BLOB);
			expect(sent).toBe(300_000);
			expect(options.headers).toEqual({
				"content-length": "300000",
				"content-type": "application/octet-stream",
			});
			expect(options.followRedirect).toBe(false);
			expect(options.timeout).toEqual({ socket: 300_000 });
			expect(percents.at(-1)).toBe(100);
			expect(percents).toEqual([...percents].sort((a, b) => a - b));
		});
	});

	it.each([
		"https://vercel.com/api/blob/?pathname=backups%2Finst-1%2Fid.cmkb",
		"https://vercel.com/api/blob",
		"https://store1.private.blob.vercel-storage.com/x?sig=1",
	])("accepts %s", async (url) => {
		await withFile(10, async (file) => {
			const { connectApiService, got } = setup();

			await connectApiService.upload(url, file, 10, () => undefined);

			expect(got.put).toHaveBeenCalledTimes(1);
		});
	});

	it.each([
		"http://vercel.com/api/blob/?pathname=x",
		"https://vercel.com/api/blobs/x",
		"https://vercel.com/account",
		"https://vercel.com.evil.example/api/blob/",
		"https://evil.example/api/blob/",
		"http://store1.private.blob.vercel-storage.com/x",
		"https://169.254.169.254/latest/meta-data",
		"https://127.0.0.1:52345/api/v1/health",
		"https://blob.vercel-storage.com.evil.com/x",
		"not a url",
	])("refuses %s without uploading", async (url) => {
		await withFile(10, async (file) => {
			const { connectApiService, got } = setup();

			await expect(connectApiService.upload(url, file, 10, () => undefined)).rejects.toThrow("Checkmate Connect returned an unexpected storage URL");
			expect(got.put).not.toHaveBeenCalled();
		});
	});

	it("lets an operator using CONNECT_API_URL choose their storage, over http or https only", async () => {
		await withFile(10, async (file) => {
			const { connectApiService, got } = setup({
				connectApiUrl: "https://self.example",
			});

			await connectApiService.upload("http://127.0.0.1:9000/blob", file, 10, () => undefined);
			await expect(connectApiService.upload("file:///etc/passwd", file, 10, () => undefined)).rejects.toThrow(
				"Checkmate Connect returned an unexpected storage URL"
			);
			expect(got.put).toHaveBeenCalledTimes(1);
		});
	});

	it("fails on a refused upload", async () => {
		await withFile(10, async (file) => {
			const { connectApiService } = setup({
				put: jest.fn<any>().mockResolvedValue({ statusCode: 500, body: "" }),
			});

			await expect(connectApiService.upload(BLOB, file, 10, () => undefined)).rejects.toThrow("blob upload failed (500)");
		});
	});

	it("reports a stalled transfer in words", async () => {
		await withFile(10, async (file) => {
			const timeout = Object.assign(new Error("Timeout awaiting 'socket' for 300000ms"), { code: "ETIMEDOUT" });
			const { connectApiService } = setup({
				put: jest.fn<any>().mockRejectedValue(timeout),
			});

			await expect(connectApiService.upload(BLOB, file, 10, () => undefined)).rejects.toThrow("transfer stalled: no data moved for 300 s");
		});
	});

	it("passes other transfer errors through", async () => {
		await withFile(10, async (file) => {
			const { connectApiService } = setup({
				put: jest.fn<any>().mockRejectedValue(new Error("socket hang up")),
			});

			await expect(connectApiService.upload(BLOB, file, 10, () => undefined)).rejects.toThrow("socket hang up");
		});
	});
});

const downloadStream = (body: Buffer, statusCode = 200) =>
	jest.fn<any>(() => {
		const stream = new PassThrough();
		setImmediate(() => {
			stream.emit("response", { statusCode });
			stream.end(body);
		});
		return stream;
	});

const ticketFor = (body: Buffer, overrides: Record<string, unknown> = {}) =>
	json(200, {
		downloadUrl: BLOB,
		sha256: crypto.createHash("sha256").update(body).digest("hex"),
		sizeBytes: body.length,
		...overrides,
	});

describe("ConnectApiService.download", () => {
	const withTarget = async (work: (file: string) => Promise<void>) => {
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "connect-download-"));
		try {
			await work(path.join(dir, "restore.cmkb"));
		} finally {
			await fs.promises.rm(dir, { recursive: true, force: true });
		}
	};

	it("asks for a download ticket, then writes the checked file and reports progress", async () => {
		const body = crypto.randomBytes(100_000);
		const post = jest.fn<any>().mockResolvedValue(ticketFor(body));
		const stream = downloadStream(body);
		const { connectApiService } = setup({ post, stream });
		const percents: number[] = [];

		await withTarget(async (file) => {
			await connectApiService.download(enrollment(), "b-1", file, (percent) => percents.push(percent));

			expect((await fs.promises.readFile(file)).equals(body)).toBe(true);
			expect((await fs.promises.stat(file)).mode & 0o777).toBe(0o600);
		});
		const [url, options] = post.mock.calls[0] as [string, any];
		expect(url).toBe(`${API}/api/agent/backups/b-1/download`);
		expect(options.json).toEqual({ agentId: "inst-1" });
		const [streamUrl, streamOptions] = stream.mock.calls[0] as [string, any];
		expect(streamUrl).toBe(BLOB);
		expect(streamOptions).toMatchObject({
			followRedirect: false,
			throwHttpErrors: false,
			timeout: { socket: 300_000 },
		});
		expect(percents.at(-1)).toBe(100);
	});

	it("refuses an untrusted storage URL without downloading", async () => {
		const body = Buffer.from("x");
		const stream = downloadStream(body);
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body, { downloadUrl: "https://evil.example/x" })),
			stream,
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow(
				"Checkmate Connect returned an unexpected storage URL"
			);
		});
		expect(stream).not.toHaveBeenCalled();
	});

	it.each([0, -1, 1.5, 50 * 1024 ** 3 + 1, Number.MAX_SAFE_INTEGER + 1])("refuses a recorded size of %s", async (sizeBytes) => {
		const body = Buffer.from("x");
		const stream = downloadStream(body);
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body, { sizeBytes })),
			stream,
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow(
				"Checkmate Connect returned an invalid backup size"
			);
		});
		expect(stream).not.toHaveBeenCalled();
	});

	it("stops a download that grows past its recorded size", async () => {
		const body = crypto.randomBytes(1_000);
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body, { sizeBytes: 500 })),
			stream: downloadStream(body),
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow("download exceeds recorded size 500");
		});
	});

	it("fails a download shorter than its recorded size", async () => {
		const body = crypto.randomBytes(500);
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body, { sizeBytes: 1_000 })),
			stream: downloadStream(body),
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow("downloaded size 500 != recorded 1000");
		});
	});

	it("fails a download whose checksum doesn't match", async () => {
		const body = crypto.randomBytes(500);
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body, { sha256: "00".repeat(32) })),
			stream: downloadStream(body),
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow(
				"downloaded archive does not match its recorded checksum"
			);
		});
	});

	it("fails on a refused download", async () => {
		const body = Buffer.from("x");
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body)),
			stream: downloadStream(Buffer.alloc(0), 403),
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow("blob download failed (403)");
		});
	});

	it("reports a stalled download in words", async () => {
		const body = Buffer.from("x");
		const stream = jest.fn<any>(() => {
			const source = new PassThrough();
			setImmediate(() =>
				source.destroy(
					Object.assign(new Error("Timeout awaiting 'socket' for 300000ms"), {
						code: "ETIMEDOUT",
					})
				)
			);
			return source;
		});
		const { connectApiService } = setup({
			post: jest.fn<any>().mockResolvedValue(ticketFor(body)),
			stream,
		});

		await withTarget(async (file) => {
			await expect(connectApiService.download(enrollment(), "b-1", file, () => undefined)).rejects.toThrow(
				"transfer stalled: no data moved for 300 s"
			);
		});
	});
});

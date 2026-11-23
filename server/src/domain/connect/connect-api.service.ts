import fs from "node:fs";
import { pipeline, Transform } from "node:stream";
import type { Got } from "got";
import type { z } from "zod";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import {
	connectApiBackupListSchema,
	connectApiDownloadTicketSchema,
	connectApiErrorSchema,
	connectApiUploadTicketSchema,
} from "@/domain/connect/connect-backup.schema.js";
import type { ConnectBackupUpload, ConnectApiBackup, ConnectApiUploadTicket } from "@/domain/connect/connect-backup.type.js";
import type { ConnectEnrollment } from "@/domain/connect/connect.type.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { createHash } from "node:crypto";
import { pipeline as pipeStreams } from "node:stream/promises";

const SERVICE_NAME = "ConnectApiService";
const TIMEOUT_MS = 15_000;
const TRANSFER_STALL_MS = 5 * 60 * 1000;
const MAX_BACKUP_BYTES = 50 * 1024 ** 3;
const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
const BLOB_API_HOST = "vercel.com";
const BLOB_API_PATH = "/api/blob";

export interface IConnectApiService {
	requestUpload(enrollment: ConnectEnrollment, upload: ConnectBackupUpload): Promise<ConnectApiUploadTicket>;
	upload(uploadUrl: string, file: string, sizeBytes: number, onPercent: (percent: number) => void): Promise<void>;
	download(enrollment: ConnectEnrollment, backupId: string, file: string, onPercent: (percent: number) => void): Promise<void>;
	complete(enrollment: ConnectEnrollment, backupId: string): Promise<void>;
	abandon(enrollment: ConnectEnrollment, backupId: string): Promise<void>;
	list(enrollment: ConnectEnrollment): Promise<ConnectApiBackup[]>;
}

export class ConnectApiService implements IConnectApiService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(
		private got: Got,
		private settingsService: ISettingsService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private apiBase = (enrollment: ConnectEnrollment): string => {
		const { connectApiUrl } = this.settingsService.getSettings();
		if (connectApiUrl) return connectApiUrl;
		if (enrollment.apiUrl) return enrollment.apiUrl;
		return `https://${new URL(enrollment.connectUrl.replace(/^wss:/, "https:")).host}`;
	};

	private isAllowedTransferUrl = (raw: string): boolean => {
		const operatorOverride = this.settingsService.getSettings().connectApiUrl !== null;
		try {
			const url = new URL(raw);
			if (operatorOverride) return url.protocol === "https:" || url.protocol === "http:";
			if (url.protocol !== "https:") return false;
			if (url.hostname.endsWith(BLOB_HOST_SUFFIX)) return true;
			return url.hostname === BLOB_API_HOST && (url.pathname === BLOB_API_PATH || url.pathname.startsWith(`${BLOB_API_PATH}/`));
		} catch {
			return false;
		}
	};

	private parseJson = (body: string): unknown => {
		try {
			return JSON.parse(body);
		} catch {
			return {};
		}
	};

	private readBody = (statusCode: number, body: string): unknown => {
		const data = this.parseJson(body);
		if (statusCode >= 200 && statusCode < 300) return data;
		const failure = connectApiErrorSchema.safeParse(data);
		throw new Error(failure.success ? failure.data.error : `Checkmate Connect responded ${statusCode}`);
	};

	private parse = <T>(schema: z.ZodType<T>, data: unknown): T => {
		const parsed = schema.safeParse(data);
		if (!parsed.success) throw new Error("Checkmate Connect returned an unexpected response");
		return parsed.data;
	};

	private post = async (url: string, body: object, token: string): Promise<unknown> => {
		const response = await this.got.post(url, {
			json: body,
			headers: { authorization: `Bearer ${token}` },
			responseType: "text",
			followRedirect: false,
			throwHttpErrors: false,
			retry: { limit: 0 },
			timeout: { request: TIMEOUT_MS },
		});
		return this.readBody(response.statusCode, response.body);
	};

	private transferError = (error: unknown): unknown => {
		if (error instanceof Error && "code" in error && error.code === "ETIMEDOUT") {
			return new Error(`transfer stalled: no data moved for ${Math.round(TRANSFER_STALL_MS / 1000)} s`);
		}
		return error;
	};

	requestUpload = async (enrollment: ConnectEnrollment, upload: ConnectBackupUpload): Promise<ConnectApiUploadTicket> => {
		const data = await this.post(
			`${this.apiBase(enrollment)}/api/agent/backups/request-upload`,
			{ agentId: enrollment.agentId, ...upload },
			enrollment.token
		);
		return this.parse(connectApiUploadTicketSchema, data);
	};

	upload = async (uploadUrl: string, file: string, sizeBytes: number, onPercent: (percent: number) => void): Promise<void> => {
		if (!this.isAllowedTransferUrl(uploadUrl)) throw new Error("Checkmate Connect returned an unexpected storage URL");
		let sent = 0;
		const meter = new Transform({
			transform(chunk: Buffer, _encoding, callback) {
				sent += chunk.length;
				onPercent(Math.min(100, Math.floor((sent / sizeBytes) * 100)));
				callback(null, chunk);
			},
		});
		const body = pipeline(fs.createReadStream(file), meter, () => undefined);

		let statusCode: number;
		try {
			const response = await this.got.put(uploadUrl, {
				body,
				headers: {
					"content-length": String(sizeBytes),
					"content-type": "application/octet-stream",
				},
				followRedirect: false,
				throwHttpErrors: false,
				retry: { limit: 0 },
				timeout: { socket: TRANSFER_STALL_MS },
			});
			statusCode = response.statusCode;
		} catch (error: unknown) {
			throw this.transferError(error);
		}
		if (statusCode < 200 || statusCode >= 300) throw new Error(`blob upload failed (${statusCode})`);
	};

	download = async (enrollment: ConnectEnrollment, backupId: string, file: string, onPercent: (percent: number) => void): Promise<void> => {
		const data = await this.post(
			`${this.apiBase(enrollment)}/api/agent/backups/${backupId}/download`,
			{ agentId: enrollment.agentId },
			enrollment.token
		);
		const ticket = this.parse(connectApiDownloadTicketSchema, data);
		if (!this.isAllowedTransferUrl(ticket.downloadUrl)) throw new Error("Checkmate Connect returned an unexpected storage URL");
		if (!Number.isSafeInteger(ticket.sizeBytes) || ticket.sizeBytes <= 0 || ticket.sizeBytes > MAX_BACKUP_BYTES) {
			throw new Error("Checkmate Connect returned an invalid backup size");
		}

		const hash = createHash("sha256");
		let received = 0;
		const meter = new Transform({
			transform(chunk: Buffer, _encoding, callback) {
				received += chunk.length;
				if (received > ticket.sizeBytes) {
					callback(new Error(`download exceeds recorded size ${ticket.sizeBytes}`));
					return;
				}
				hash.update(chunk);
				onPercent(Math.min(100, Math.floor((received / ticket.sizeBytes) * 100)));
				callback(null, chunk);
			},
		});
		const source = this.got.stream(ticket.downloadUrl, {
			followRedirect: false,
			throwHttpErrors: false,
			retry: { limit: 0 },
			timeout: { socket: TRANSFER_STALL_MS },
		});
		source.once("response", (response: { statusCode: number }) => {
			if (response.statusCode >= 200 && response.statusCode < 300) return;
			source.destroy(new Error(`blob download failed (${response.statusCode})`));
		});

		try {
			await pipeStreams(source, meter, fs.createWriteStream(file, { mode: 0o600 }));
		} catch (error: unknown) {
			throw this.transferError(error);
		}
		if (received !== ticket.sizeBytes) throw new Error(`downloaded size ${received} != recorded ${ticket.sizeBytes}`);
		if (hash.digest("hex") !== ticket.sha256) throw new Error("downloaded archive does not match its recorded checksum");
	};

	complete = async (enrollment: ConnectEnrollment, backupId: string): Promise<void> => {
		await this.post(`${this.apiBase(enrollment)}/api/agent/backups/${backupId}/complete`, {}, enrollment.token);
	};

	abandon = async (enrollment: ConnectEnrollment, backupId: string): Promise<void> => {
		try {
			await this.post(`${this.apiBase(enrollment)}/api/agent/backups/${backupId}/abandon`, {}, enrollment.token);
		} catch (error: unknown) {
			this.logger.warn({ err: error, backupId }, "Connect could not release the failed upload");
		}
	};

	list = async (enrollment: ConnectEnrollment): Promise<ConnectApiBackup[]> => {
		const response = await this.got.get(`${this.apiBase(enrollment)}/api/agent/backups`, {
			searchParams: { agentId: enrollment.agentId },
			headers: { authorization: `Bearer ${enrollment.token}` },
			responseType: "text",
			followRedirect: false,
			throwHttpErrors: false,
			retry: { limit: 0 },
			timeout: { request: TIMEOUT_MS },
		});
		return this.parse(connectApiBackupListSchema, this.readBody(response.statusCode, response.body)).backups;
	};
}

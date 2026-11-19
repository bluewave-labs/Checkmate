import { beforeAll, describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import {
	ConnectBackupCollections,
	ConnectConfigExcludedCollections,
	ConnectRuntimeCollections,
} from "../../../src/domain/connect/connect-backup.type.ts";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src");
let modelCollections: string[] = [];

beforeAll(async () => {
	const modelFiles = fs.globSync("domain/**/*.model.ts", { cwd: srcRoot });
	await Promise.all(modelFiles.map((file) => import(pathToFileURL(path.join(srcRoot, file)).href)));
	modelCollections = mongoose.modelNames().map((name) => mongoose.model(name).collection.collectionName);
});

describe("Connect backup collections", () => {
	it("finds the models", () => {
		expect(modelCollections).toEqual(expect.arrayContaining(["monitors", "jobs", "connect_state"]));
	});

	it("puts every model's collection in exactly one list", () => {
		const backup: readonly string[] = ConnectBackupCollections;
		const runtime: readonly string[] = ConnectRuntimeCollections;
		const unlisted = modelCollections.filter((name) => !backup.includes(name) && !runtime.includes(name));
		const both = modelCollections.filter((name) => backup.includes(name) && runtime.includes(name));

		expect(unlisted).toEqual([]);
		expect(both).toEqual([]);
	});

	it("lists no collection that no model creates", () => {
		const listed = [...ConnectBackupCollections, ...ConnectRuntimeCollections];

		expect(listed.filter((name) => !modelCollections.includes(name))).toEqual([]);
	});

	it("never backs up queue or registry state", () => {
		const backup: readonly string[] = ConnectBackupCollections;

		for (const runtime of ["jobs", "queueworkers", "connect_state"]) {
			expect(backup).not.toContain(runtime);
		}
	});

	it("keeps check history out of config backups only", () => {
		const backup: readonly string[] = ConnectBackupCollections;

		expect(ConnectConfigExcludedCollections.every((name) => backup.includes(name))).toBe(true);
	});
});

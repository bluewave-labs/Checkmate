import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pathsToModuleNameMapper } from "ts-jest";
import type { Config } from "jest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tsconfigPath = path.resolve(__dirname, "./tsconfig.json");
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

const config: Config = {
	rootDir: ".",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.(t|j)sx?$": ["ts-jest", { useESM: true, tsconfig: "./tsconfig.jest.json" }],
	},
	moduleNameMapper: {
		...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, { prefix: "<rootDir>/" }),
	},
	testMatch: ["<rootDir>/test/**/*.test.ts"],
	setupFilesAfterEnv: [],
	collectCoverageFrom: ["src/**/*.ts"],
	coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
	clearMocks: true,
};

export default config;

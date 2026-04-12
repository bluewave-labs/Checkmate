import type { Config } from "jest";

const config: Config = {
	rootDir: ".",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.(t|j)sx?$": ["ts-jest", { useESM: true, tsconfig: "./tsconfig.jest.json" }],
	},
	moduleNameMapper: {
		"^@/validation/(.*)\\.js$": "<rootDir>/src/validation/$1.js",
		"^@/utils/(.*)\\.js$": "<rootDir>/src/utils/$1.ts",
		"^@/(.*)\\.ts$": "<rootDir>/src/$1.ts",
		"^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	testMatch: ["<rootDir>/test/**/*.test.ts"],
	setupFilesAfterEnv: [],
	collectCoverageFrom: ["src/**/*.ts"],
	coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
	clearMocks: true,
};

export default config;

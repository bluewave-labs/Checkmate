/** @type {import('jest').Config} */
const config = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	rootDir: "./",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts", "**/*.test.js"],
	verbose: true,
	moduleNameMapper: {
		"^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
		"^@/(.*)$": "<rootDir>/src/$1",
		"^(\\.\\.?/.*)\\.js$": "$1"
	},
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.(t|j)s$": ["ts-jest", { useESM: true, tsconfig: "./tsconfig.jest.json" }]
    },
    transformIgnorePatterns: [
        "/node_modules/"
    ],
	collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov"],
	coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/src/index.ts"],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 90,
			lines: 90,
			statements: 90,
		},
	},
};

export default config;

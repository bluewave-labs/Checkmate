import { jest } from "@jest/globals";

export const createMockLogger = () => ({
	serviceName: "test",
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
	cacheLog: jest.fn(),
	getLogs: jest.fn().mockReturnValue([]),
	buildLogEntry: jest.fn().mockReturnValue({ level: "info", timestamp: new Date().toISOString() }),
});

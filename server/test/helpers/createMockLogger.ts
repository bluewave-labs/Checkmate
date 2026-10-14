import { jest } from "@jest/globals";

export const createMockLogger = () => ({
	serviceName: "test",
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
	getLogs: jest.fn().mockReturnValue([]),
	configure: jest.fn(),
	flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
});

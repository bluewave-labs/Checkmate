import { jest } from "@jest/globals";

export const createMockLogger = () => {
	const mock = {
		serviceName: "test",
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		getLogs: jest.fn().mockReturnValue([]),
		httpMiddleware: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
		child: jest.fn(),
	};
	// A child shares the parent's spies, so assertions on logger.warn etc. keep working after a service migrates to child()
	mock.child.mockImplementation(() => mock);
	return mock;
};

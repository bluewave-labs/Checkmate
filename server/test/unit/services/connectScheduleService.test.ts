import { describe, expect, it, jest } from "@jest/globals";
import { ConnectScheduleService } from "../../../src/domain/connect/connect-schedule.service.ts";
import type { ConnectSchedule } from "../../../src/domain/connect/connect-backup.type.ts";
import type { IJobScheduler } from "../../../src/worker/worker.interface.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const DAILY_CONFIG: ConnectSchedule = { enabled: true, intervalHours: 24, kind: "config" };

const setup = async (
	opts: {
		schedule?: ConnectSchedule | null;
		enrolled?: boolean;
		recoveryKey?: boolean;
		busy?: boolean;
	} = {}
) => {
	const logger = createMockLogger();
	const repository = new InMemoryConnectRepository();
	await repository.setEnrollment({
		connectUrl: "wss://relay.checkmate.so/api/tunnel",
		agentId: "inst-1",
		token: "v1.token",
		apiUrl: null,
	});
	if (opts.recoveryKey !== false) await repository.setRecoveryKeyIfUnset("v1.key");
	const schedule = opts.schedule === undefined ? DAILY_CONFIG : opts.schedule;
	if (schedule) await repository.setSchedule(schedule);
	if (opts.busy) await repository.requestOperation({ type: "restore", backupId: "b-9", requestedAt: new Date(), startedAt: null });
	if (opts.enrolled === false) await repository.clearEnrollment();
	const scheduler = { addGlobalJob: jest.fn(async (_type: string) => undefined) };
	const service = new ConnectScheduleService(repository, scheduler as unknown as IJobScheduler, logger as any);
	return { service, repository, scheduler, logger };
};

describe("ConnectScheduleService.handleJob", () => {
	it("queues a backup of the scheduled kind and arms the operation row", async () => {
		const { service, repository, scheduler, logger } = await setup();

		await service.handleJob();

		expect((await repository.get()).operation).toEqual({
			type: "backup",
			kind: "config",
			requestedAt: expect.any(Date),
			startedAt: null,
		});
		expect(scheduler.addGlobalJob).toHaveBeenCalledWith("connect-operation");
		expect(logger.info).toHaveBeenCalledWith({ kind: "config" }, "Scheduled Connect backup queued");
	});

	it("queues a full backup when the schedule says so", async () => {
		const { service, repository } = await setup({ schedule: { enabled: true, intervalHours: 168, kind: "full" } });

		await service.handleJob();

		expect((await repository.get()).operation).toMatchObject({ type: "backup", kind: "full" });
	});

	it("skips the run while another operation is queued or running", async () => {
		const { service, repository, scheduler, logger } = await setup({ busy: true });

		await service.handleJob();

		expect((await repository.get()).operation?.type).toBe("restore");
		expect(scheduler.addGlobalJob).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith("Scheduled Connect backup skipped: another backup, restore or key check is in progress");
	});

	it("records nothing in the last backup when it skips", async () => {
		const { service, repository } = await setup({ busy: true });

		await service.handleJob();

		expect((await repository.get()).lastBackup).toBeNull();
	});

	it.each([
		["the schedule is off", { schedule: { ...DAILY_CONFIG, enabled: false } }],
		["there is no schedule", { schedule: null }],
		["the installation was unenrolled", { enrolled: false }],
		["there is no recovery key", { recoveryKey: false }],
	])("does nothing when %s", async (_label, opts) => {
		const { service, repository, scheduler, logger } = await setup(opts);

		await service.handleJob();

		expect((await repository.get()).operation).toBeNull();
		expect(scheduler.addGlobalJob).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
	});

	it("lets a database failure reach the queue so the row is retried", async () => {
		const { service, repository } = await setup();
		jest.spyOn(repository, "get").mockRejectedValue(new Error("db down"));

		await expect(service.handleJob()).rejects.toThrow("db down");
	});

	it("never queues a second backup when retried after arming failed", async () => {
		const { service, repository, scheduler } = await setup();
		scheduler.addGlobalJob.mockRejectedValueOnce(new Error("db down"));

		await expect(service.handleJob()).rejects.toThrow("db down");
		const queued = (await repository.get()).operation;
		await service.handleJob();

		expect((await repository.get()).operation).toEqual(queued);
		expect(scheduler.addGlobalJob).toHaveBeenCalledTimes(1);
	});
});

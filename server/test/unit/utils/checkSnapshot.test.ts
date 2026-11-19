import { describe, expect, it } from "@jest/globals";
import { toCheckSnapshot, type CheckSnapshotSource } from "../../../src/domain/checks/check.snapshot.ts";

const makeSource = (overrides?: Partial<CheckSnapshotSource>): CheckSnapshotSource => ({
	id: "check-1",
	status: true,
	responseTime: 12,
	statusCode: 200,
	message: "OK",
	createdAt: "2026-11-10T08:12:00.000Z",
	...overrides,
});

describe("toCheckSnapshot raid", () => {
	it("keeps only the array health fields the monitors table needs", () => {
		const snapshot = toCheckSnapshot(
			makeSource({
				raid: [
					{
						device: "/dev/md1",
						level: "raid1",
						state: "clean",
						raid_disks: 2,
						degraded_disks: 1,
						sync_action: "recover",
						sync_progress: 0.42,
						members: [{ device: "/dev/sda2", state: "in_sync" }],
					},
				],
			})
		);

		expect(snapshot.raid).toEqual([{ device: "/dev/md1", state: "clean", degraded_disks: 1, sync_action: "recover", sync_progress: 0.42 }]);
	});

	it("keeps an empty list and leaves raid unset when the check had none", () => {
		expect(toCheckSnapshot(makeSource({ raid: [] })).raid).toEqual([]);
		expect(toCheckSnapshot(makeSource()).raid).toBeUndefined();
	});
});

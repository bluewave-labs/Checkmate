import { z } from "zod";

export const StorageAlertReasons = ["array_degraded", "array_inactive", "drive_failed", "drive_warning"] as const;

// An active storage alert on a hardware monitor, kept on the monitor between checks because drives are only read on the
// slower SMART cadence (see domain/storage/storage-alert.ts).
export const storageBreachSchema = z.object({
	// Array device (e.g. /dev/md1) for array reasons, drive serial for drive reasons
	subject: z.string(),
	reason: z.enum(StorageAlertReasons),
	detail: z.string(),
	// Drive reasons only: the device path when the breach was seen, and the model for messages
	device: z.string().optional(),
	model: z.string().optional(),
});

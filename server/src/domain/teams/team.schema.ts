import { z } from "zod";

export const heartbeatKeyResponseSchema = z.object({ heartbeatKey: z.string() }).meta({ id: "HeartbeatKey" });
export type HeartbeatKeyResult = z.infer<typeof heartbeatKeyResponseSchema>;

export const heartbeatKeyStatusResponseSchema = z.object({ hasKey: z.boolean() }).meta({ id: "HeartbeatKeyStatus" });
export type HeartbeatKeyStatusResult = z.infer<typeof heartbeatKeyStatusResponseSchema>;

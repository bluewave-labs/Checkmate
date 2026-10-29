import { z } from "zod";

export const heartbeatResponseSchema = z.object({ received: z.boolean() }).meta({ id: "HeartbeatResponse" });

export const heartbeatTokenResponseSchema = z.object({ heartbeatToken: z.string() }).meta({ id: "HeartbeatToken" });
export type HeartbeatTokenResult = z.infer<typeof heartbeatTokenResponseSchema>;

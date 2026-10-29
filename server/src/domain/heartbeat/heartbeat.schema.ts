import { z } from "zod";

export const heartbeatResponseSchema = z.object({ received: z.boolean() }).meta({ id: "HeartbeatResponse" });

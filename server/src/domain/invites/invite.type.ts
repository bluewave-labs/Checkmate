import type { z } from "zod";
import type { inviteSchema } from "@/domain/invites/invite.schema.js";

export type Invite = z.infer<typeof inviteSchema>;

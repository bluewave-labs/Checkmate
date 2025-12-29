import { z } from "zod";

export const recoverySchema = z.object({
  email: z.email({ message: "Invalid email address" }).trim().toLowerCase(),
});


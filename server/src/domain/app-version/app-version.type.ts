import type { z } from "zod";
import type { appVersionInfoSchema } from "@/domain/app-version/app-version.schema.js";

export type AppVersionInfo = z.infer<typeof appVersionInfoSchema>;

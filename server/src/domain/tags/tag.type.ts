import type { z } from "zod";
import type { tagSchema } from "@/domain/tags/tag.schema.js";

export type Tag = z.infer<typeof tagSchema>;

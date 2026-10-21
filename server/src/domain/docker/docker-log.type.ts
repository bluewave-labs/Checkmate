import type { dockerLogMetadataSchema, dockerLogPageSchema, dockerLogSchema } from "@/domain/docker/docker-log.schema.js";
import type { z } from "zod";

export const DOCKER_LOG_RETENTION_DAYS = 7;
export const DOCKER_LOG_PAGE_DEFAULT = 20;
export const DOCKER_LOG_PAGE_MAX = 50;

export type DockerLogMetadata = z.infer<typeof dockerLogMetadataSchema>;
export type DockerLog = z.infer<typeof dockerLogSchema>;
export type DockerLogPage = z.infer<typeof dockerLogPageSchema>;

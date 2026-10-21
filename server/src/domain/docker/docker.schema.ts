import { z } from "zod";
import { DockerContainerStates, DockerHealthStatuses, DockerLogStreams, DockerPortProtocols } from "./docker.type.js";

export const dockerLogLineSchema = z.object({
	ts: z.string(),
	stream: z.enum(DockerLogStreams),
	text: z.string(),
});

export const dockerContainerPortSchema = z.object({
	privatePort: z.number(),
	protocol: z.enum(DockerPortProtocols),
	publicPort: z.number().optional(),
	hostIp: z.string().optional(),
});

export const dockerContainerMountSchema = z.object({
	type: z.string(),
	name: z.string().optional(),
	source: z.string(),
	destination: z.string(),
	mode: z.string(),
	rw: z.boolean(),
});

export const dockerContainerInfoSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		image: z.string(),
		state: z.enum(DockerContainerStates),
		status: z.string(),
		health: z.enum(DockerHealthStatuses),
		cpuPct: z.number().optional(),
		memoryUsedBytes: z.number().optional(),
		memoryLimitBytes: z.number().optional(),
		memoryPct: z.number().optional(),
		restartCount: z.number().optional(),
		startedAt: z.string().optional(),
		ports: z.array(dockerContainerPortSchema).optional(),
		mounts: z.array(dockerContainerMountSchema).optional(),
		exitCode: z.number().optional(),
	})
	.meta({ id: "DockerContainer" });

export const dockerContainerSummarySchema = z.object({
	total: z.number(),
	running: z.number(),
	stopped: z.number(),
	unhealthy: z.number(),
});

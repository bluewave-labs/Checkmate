import type { CaptureAgent } from "@/types/captureAgent.js";

export interface CreateCaptureAgentInput {
	teamId: string;
	name: string;
	url: string;
	secret: string;
	agentTokenCipher?: string;
	canCollectMetrics: boolean;
	canExecuteScripts: boolean;
	tags?: string[];
}

export type UpdateCaptureAgentInput = Partial<Omit<CreateCaptureAgentInput, "teamId">> & {
	isActive?: boolean;
	lastSeen?: Date;
};

export interface ICaptureAgentRepository {
	create(input: CreateCaptureAgentInput): Promise<CaptureAgent>;
	findById(id: string): Promise<CaptureAgent | null>;
	findByIdAndTeam(id: string, teamId: string): Promise<CaptureAgent | null>;
	findByTeam(teamId: string): Promise<CaptureAgent[]>;
	updateById(id: string, patch: UpdateCaptureAgentInput): Promise<CaptureAgent>;
	deleteById(id: string): Promise<boolean>;
	touchLastSeen(id: string): Promise<void>;
}

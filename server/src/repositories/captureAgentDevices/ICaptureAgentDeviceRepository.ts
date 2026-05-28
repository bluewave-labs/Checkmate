import type { CaptureAgentDevice, DeviceOS, DeviceAuthType } from "@/types/captureAgent.js";

export interface CreateCaptureAgentDeviceInput {
	captureAgentId: string;
	teamId: string;
	name: string;
	hostname: string;
	ipAddress?: string;
	os: DeviceOS;
	authType: DeviceAuthType;
	username?: string;
	encryptedPassword?: string;
	sshKeyFingerprint?: string;
	port?: number;
	tags?: string[];
}

export type UpdateCaptureAgentDeviceInput = Partial<Omit<CreateCaptureAgentDeviceInput, "captureAgentId" | "teamId">>;

export interface ICaptureAgentDeviceRepository {
	create(input: CreateCaptureAgentDeviceInput): Promise<CaptureAgentDevice>;
	findById(id: string): Promise<CaptureAgentDevice | null>;
	findByIdAndTeam(id: string, teamId: string): Promise<CaptureAgentDevice | null>;
	findByAgent(captureAgentId: string): Promise<CaptureAgentDevice[]>;
	updateById(id: string, patch: UpdateCaptureAgentDeviceInput): Promise<CaptureAgentDevice>;
	deleteById(id: string): Promise<boolean>;
	deleteByAgent(captureAgentId: string): Promise<number>;
}

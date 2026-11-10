import type { ConnectEnrollment, ConnectState } from "@/domain/connect/connect.type.js";

export interface IConnectRepository {
	// create
	setEnrollment(enrollment: ConnectEnrollment): Promise<void>;
	// fetch
	get(): Promise<ConnectState>;
	// update
	setSecrets(secrets: { token?: string }): Promise<void>;
	setRemoteAccess(enabled: boolean): Promise<void>;
	clearEnrollment(): Promise<void>;
	// delete
}

import type { IConnectRepository } from "../../src/domain/connect/connect.repository.interface.ts";
import type { ConnectEnrollment, ConnectState } from "../../src/domain/connect/connect.type.ts";

export class InMemoryConnectRepository implements IConnectRepository {
	private state: ConnectState = { enrollment: null, remoteAccessEnabled: false };
	private stored = false;

	async setEnrollment(enrollment: ConnectEnrollment): Promise<void> {
		this.state = { ...this.state, enrollment: { ...enrollment } };
		this.stored = true;
	}

	async get(): Promise<ConnectState> {
		return { ...this.state, enrollment: this.state.enrollment ? { ...this.state.enrollment } : null };
	}

	async setSecrets(secrets: { token?: string }): Promise<void> {
		if (secrets.token === undefined || this.state.enrollment === null) return;
		this.state = { ...this.state, enrollment: { ...this.state.enrollment, token: secrets.token } };
	}

	async setRemoteAccess(enabled: boolean): Promise<void> {
		if (!this.stored) return;
		this.state = { ...this.state, remoteAccessEnabled: enabled };
	}

	async clearEnrollment(): Promise<void> {
		this.state = { ...this.state, enrollment: null, remoteAccessEnabled: false };
	}
}

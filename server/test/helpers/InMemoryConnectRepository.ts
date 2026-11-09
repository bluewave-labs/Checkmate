import type { IConnectRepository } from "../../src/domain/connect/connect.repository.interface.ts";
import type { ConnectEnrollment, ConnectState } from "../../src/domain/connect/connect.type.ts";

export class InMemoryConnectRepository implements IConnectRepository {
	private state: ConnectState = { enrollment: null };

	async setEnrollment(enrollment: ConnectEnrollment): Promise<void> {
		this.state = { ...this.state, enrollment: { ...enrollment } };
	}

	async get(): Promise<ConnectState> {
		return { ...this.state, enrollment: this.state.enrollment ? { ...this.state.enrollment } : null };
	}

	async setSecrets(secrets: { token?: string }): Promise<void> {
		if (secrets.token === undefined || this.state.enrollment === null) return;
		this.state = { ...this.state, enrollment: { ...this.state.enrollment, token: secrets.token } };
	}

	async clearEnrollment(): Promise<void> {
		this.state = { ...this.state, enrollment: null };
	}
}

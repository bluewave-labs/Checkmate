import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { User } from "@/domain/users/user.type.js";

export interface ISsoPolicyService {
	passwordLoginAllowed(user: User): Promise<boolean>;
}

// Decides who may still use a password. Mirrors SsoSessionService's shape: repositories injected positionally.
export class SsoPolicyService implements ISsoPolicyService {
	static SERVICE_NAME = "SsoPolicyService";

	constructor(private connectRepository: IConnectRepository) {}

	passwordLoginAllowed = async (user: User) => {
		const { enrollment, sso } = await this.connectRepository.get();
		if (!enrollment || sso?.enabled !== true) return true;
		// The superadmin keeps a password so a broken SSO setup can never lock everyone out
		if (user.role.includes("superadmin")) return true;
		if (user.sso) return false;
		return sso.enforce !== true;
	};
}

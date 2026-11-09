import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ConnectState } from "@/domain/connect/connect.type.js";

export const ENCRYPTED_PREFIX = "v1.";

const decryptSecret = (value: string, encryptionService: IEncryptionService) =>
	value.startsWith(ENCRYPTED_PREFIX) ? encryptionService.decrypt(value) : value;

export const revealConnectState = (state: ConnectState, encryptionService: IEncryptionService): ConnectState => ({
	...state,
	enrollment: state.enrollment ? { ...state.enrollment, token: decryptSecret(state.enrollment.token, encryptionService) } : null,
	recoveryKey: state.recoveryKey ? decryptSecret(state.recoveryKey, encryptionService) : null,
});

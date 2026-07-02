import type { RecoveryToken } from "@/domain/recovery-tokens/recovery-token.type.js";

export interface IRecoveryTokensRepository {
	// create
	create(email: string): Promise<RecoveryToken>;
	// fetch
	findByToken(token: string): Promise<RecoveryToken>;
	// update
	// delete
	deleteManyByEmail(email: string): Promise<number>;
	// other
}

import type { RecoveryToken } from "@/types/recoveryToken.js";

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

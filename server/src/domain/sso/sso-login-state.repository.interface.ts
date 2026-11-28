export interface ISsoLoginStateRepository {
	// create
	create(state: string, returnOrigin: string, expiresAt: Date): Promise<void>;
	// update
	// Atomic single use: returns the stored origin only if the state was unused and unexpired, and marks it used
	consume(state: string, now: Date): Promise<{ returnOrigin: string } | null>;
}

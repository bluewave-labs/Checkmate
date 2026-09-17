import type { EgressProbeResult, EgressState } from "@/domain/egress/egress.type.js";

export interface IEgressStateRepository {
	// read
	findSingleton(): Promise<EgressState>; // creates the "ok" singleton on first call, a plain read after that
	// update
	recordProbe(results: EgressProbeResult[], now: Date): Promise<EgressState>;
	reset(): Promise<EgressState>; // back to "ok" with no episode; used when the feature is toggled
	// Atomic transitions. Each returns the updated state when this caller performed the transition,
	// or null when the state was already on the target side (another worker got there first).
	markDegraded(results: EgressProbeResult[], now: Date): Promise<EgressState | null>;
	markRecovered(results: EgressProbeResult[], now: Date): Promise<EgressState | null>;
}

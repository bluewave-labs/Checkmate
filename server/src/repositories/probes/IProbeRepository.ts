import type { ProbeServer, ProbeServerSummary } from "@/types/script.js";

export interface RegisterProbeInput {
	teamId: string;
	name: string;
	url: string;
	probeSecretHashed: string;
}

export interface IProbeRepository {
	register(input: RegisterProbeInput): Promise<ProbeServerSummary>;
	findById(probeId: string, teamId: string): Promise<ProbeServer>;
	findByTeamId(teamId: string): Promise<ProbeServerSummary[]>;
	updateLastSeen(probeId: string, teamId: string): Promise<void>;
	deactivate(probeId: string, teamId: string): Promise<void>;
}

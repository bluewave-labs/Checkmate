import type { Script, ScriptSummary } from "@/types/script.js";

export interface CreateScriptInput {
	teamId: string;
	createdBy: string;
	name: string;
	description?: string;
	runtime: Script["runtime"];
	bodyHash: string;
	encryptedBody: string;
	parameters: Record<string, string>;
}

export interface UpdateScriptInput {
	name?: string;
	description?: string;
	runtime?: Script["runtime"];
	bodyHash?: string;
	encryptedBody?: string;
	parameters?: Record<string, string>;
}

export interface IScriptRepository {
	create(input: CreateScriptInput): Promise<Script>;
	findById(scriptId: string, teamId: string): Promise<Script>;
	findByTeamId(teamId: string): Promise<ScriptSummary[]>;
	update(scriptId: string, teamId: string, input: UpdateScriptInput): Promise<Script>;
	delete(scriptId: string, teamId: string): Promise<void>;
}

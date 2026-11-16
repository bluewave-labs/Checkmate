import type { ConnectEnrollBody } from "@/Types/Connect";

export const parseCredentialBlock = (raw: string): ConnectEnrollBody | null => {
	const fields: Record<string, string> = {};
	for (const line of raw.split(/\r?\n/)) {
		const match = line
			.trim()
			.match(/^(CONNECT_URL|CONNECT_AGENT|CONNECT_TOKEN|CONNECT_API)=(.+)$/);
		if (match) fields[match[1]] = match[2].trim();
	}
	if (!fields.CONNECT_URL || !fields.CONNECT_AGENT || !fields.CONNECT_TOKEN) return null;
	return {
		connectUrl: fields.CONNECT_URL,
		agentId: fields.CONNECT_AGENT,
		token: fields.CONNECT_TOKEN,
		...(fields.CONNECT_API ? { apiUrl: fields.CONNECT_API } : {}),
	};
};

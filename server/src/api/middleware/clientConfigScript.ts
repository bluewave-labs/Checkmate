import type { Request, Response } from "express";
import type { ClientRuntimeConfig } from "@/domain/app-settings/app-settings.type.js";
import { CONNECT_TUNNEL_HEADER } from "@/domain/connect/connect.type.js";

const renderClientConfig = (config: ClientRuntimeConfig): string =>
	`window.__CHECKMATE_CONFIG__ = ${JSON.stringify(config).replace(/</g, "\\u003c")};`;

export const createClientConfigScript = (clientConfig: ClientRuntimeConfig) => {
	const script = renderClientConfig(clientConfig);
	const tunnelScript = renderClientConfig({ ...clientConfig, clientHost: undefined });

	return (req: Request, res: Response) => {
		res
			.set("Cache-Control", "no-cache")
			.type("application/javascript")
			.send(req.get(CONNECT_TUNNEL_HEADER) ? tunnelScript : script);
	};
};

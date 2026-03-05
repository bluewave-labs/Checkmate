/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_APP_API_V2_BASE_URL?: string;
	readonly VITE_APP_LOG_LEVEL?: "debug" | "info" | "warn" | "error";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module "*.svg?react" {
	import * as React from "react";
	const ReactComponent: React.FunctionComponent<
		React.SVGProps<SVGSVGElement> & { title?: string }
	>;
	export default ReactComponent;
}

declare module "*.css" {
	const content: string;
	export default content;
}

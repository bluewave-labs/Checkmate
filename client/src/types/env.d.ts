/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_API_V2_BASE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({}) => {
	const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));
	const version = pkg.version;

	const allowedHosts = process.env.VITE_ALLOWED_HOSTS
		? process.env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim())
		: true;

	return {
		base: "/",
		plugins: [svgr(), react()],
		server: {
			host: true,
			allowedHosts,
		},
		preview: {
			host: true,
			allowedHosts,
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
		optimizeDeps: {
			include: ["@mui/material/Tooltip", "@emotion/styled"],
		},
		define: {
			__APP_VERSION__: JSON.stringify(version),
		},
	};
});

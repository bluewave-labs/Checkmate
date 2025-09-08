import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { execSync } from "child_process";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	let version = "3.1.6";

	return {
		base: "/",
		plugins: [svgr(), react()],
		optimizeDeps: {
			include: ["@mui/material/Tooltip", "@emotion/styled"],
		},
		define: {
			__APP_VERSION__: JSON.stringify(version),
		},
	};
});

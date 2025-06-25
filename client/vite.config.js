import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { execSync } from "child_process";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	let version;
	try {
		version =
			env.VITE_APP_VERSION ||
			execSync("git describe --tags --abbrev=0").toString().trim();
	} catch (error) {
		version = "unknown";
	}

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

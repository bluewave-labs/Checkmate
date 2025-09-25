import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig(({}) => {
	let version = "3.2.0";

	return {
		base: "/",
		plugins: [svgr(), react()],
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

import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		// The logger reads window.location and navigator.userAgent.
		environment: "jsdom",
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
	},
});

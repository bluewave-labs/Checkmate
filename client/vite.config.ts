import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicReload = (): Plugin => ({
  name: "public-reload",
  configureServer(server) {
    // Watch all files under public and trigger a full reload on change
    server.watcher.add("public/**");
    const reload = () => server.ws.send({ type: "full-reload" });
    server.watcher.on("add", reload);
    server.watcher.on("change", reload);
    server.watcher.on("unlink", reload);
  },
});

export default defineConfig(() => {
  return {
    base: "/",
    plugins: [svgr(), react(), publicReload()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    optimizeDeps: {
      include: ["@mui/material/Tooltip", "@emotion/styled"],
    },
  };
});

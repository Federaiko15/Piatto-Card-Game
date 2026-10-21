import {
  defineConfig,
  defaultClientConditions,
  searchForWorkspaceRoot,
} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: "0.0.0.0",
    // game-core vive fuori da questa cartella: autorizziamo solo lei, non tutto il repository (es. backend/.env)
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        "../packages/game-core",
      ],
    },
  },
  resolve: {
    // "source" fa leggere a Vite i sorgenti TypeScript di game-core invece della build in dist/
    conditions: ["source", ...defaultClientConditions],
  },
  plugins: [react(), tailwindcss()],
});

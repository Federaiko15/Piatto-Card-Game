import {
  defineConfig,
  defaultClientConditions,
  searchForWorkspaceRoot,
} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // itch.io serve il gioco da una sottocartella: con "./" tutti i file si cercano accanto a index.html
  base: mode === "itch" ? "./" : "/",
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
  plugins: [
    react(),
    tailwindcss(),
    // su itch.io il gioco non si installa come app: via il manifest della PWA (e le sue icone, 11 MB)
    mode === "itch" && {
      name: "itch-no-manifest",
      transformIndexHtml: (html: string) => html.replace(/<link\s+rel="manifest"[^>]*>\s*/, ""),
    },
  ],
}));

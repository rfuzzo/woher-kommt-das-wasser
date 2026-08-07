import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  root: "static-site",
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: "../dist-pages",
  },
});

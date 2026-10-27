import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the build works under GitHub Pages' /<repo>/ path.
  base: "./",
  server: { port: 5173 },
});

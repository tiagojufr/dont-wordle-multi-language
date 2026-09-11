import { defineConfig } from "vite";

export default defineConfig({
  base: "/dont-wordle-multi-language/",
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "localhost",
    port: 4173,
    strictPort: true,
  },
});

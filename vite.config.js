import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { aiMiddleware } from "./server/ai.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "OPENAI_");
  const config = { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || "gpt-4o-mini" };
  return {
  plugins: [react(), {
    name: "local-ai-api",
    configureServer(server) { server.middlewares.use(aiMiddleware(config)); },
    configurePreviewServer(server) { server.middlewares.use(aiMiddleware(config)); },
  }],
  server: {
    port: 5173,
  },
  };
});

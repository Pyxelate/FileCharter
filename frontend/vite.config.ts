import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import {tanstackRouter} from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read the repo-root .env (the "" prefix loads all vars, not just VITE_*) and
  // build the backend base URL from BACKEND_PORT — the single source of truth,
  // shared with the backend's config.rs. Only this URL is injected into the
  // client (via `define`); no other env values reach the browser bundle.
  const env = loadEnv(mode, path.resolve(import.meta.dirname, ".."), "")
  const backendUrl =
    env.VITE_BACKEND_URL ?? `http://localhost:${env.BACKEND_PORT ?? "3000"}`

  return {
    plugins: [tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
      react(),
      tailwindcss(),],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    define: {
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
    test: {
      // Components need a DOM to render into; without this vitest defaults to
      // the "node" environment and React Testing Library's render() throws.
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  }
})

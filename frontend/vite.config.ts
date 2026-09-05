import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vitest/config'
import {tanstackRouter} from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({

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
  test: {
    // Components need a DOM to render into; without this vitest defaults to
    // the "node" environment and React Testing Library's render() throws.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
})

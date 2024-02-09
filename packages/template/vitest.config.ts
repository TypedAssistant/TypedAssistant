import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    clearMocks: true,
    setupFiles: ["vitest.setup.ts"],
    environment: "happy-dom",
  },
})

import { defineConfig } from "vitest/config";

/** @type {import('vitest/config').defineConfig} */
export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "json", "html", "clover", "json-summary"],
      include: ["src/**/*"],
    },
  },
});

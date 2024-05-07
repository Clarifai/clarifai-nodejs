import { defineConfig } from "vitest/config";
import EnvironmentPlugin from "vite-plugin-environment";

/** @type {import('vitest/config').defineConfig} */
export default defineConfig({
  plugins: [
    EnvironmentPlugin("all", { prefix: "CLARIFAI_" }),
    EnvironmentPlugin("all", { prefix: "VITE_CLARIFAI_" }),
  ],
  test: {
    coverage: {
      reporter: ["text", "json", "html", "clover", "json-summary"],
      include: ["src/**/*"],
    },
  },
});

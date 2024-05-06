import { defineConfig } from "vitest/config";
import EnvironmentPlugin from "vite-plugin-environment";

/** @type {import('vitest/config').defineConfig} */
export default defineConfig({
  plugins: [
    EnvironmentPlugin([
      "CLARIFAI_USER_ID",
      "CLARIFAI_PAT",
      "CLARIFAI_APP_ID",
      "CLARIFAI_NODEJS_LOG_PATH",
      "CLARIFAI_NODEJS_DEBUG",
    ]),
  ],
  test: {
    coverage: {
      reporter: ["text", "json", "html", "clover", "json-summary"],
      include: ["src/**/*"],
    },
  },
});

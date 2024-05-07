module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  env: {
    node: true,
  },
  overrides: [
    {
      files: ["typedoc-plugins/**/*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["*.ts"],
      excludedFiles: ["example/**/*.ts", "examples/**/*.ts", "**/*.test.ts"],
      rules: {
        "no-console": "error",
      },
    },
  ],
};

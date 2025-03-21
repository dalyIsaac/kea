import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/**/*.test.js",
  srcDir: "src",
  coverage: {
    includeAll: true,
    reporter: ["lcov"],
  },
});

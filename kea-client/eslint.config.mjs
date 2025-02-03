import eslint from "@eslint/js";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    plugins: {
      "react-hooks": hooksPlugin,
    },
    rules: hooksPlugin.configs.recommended.rules,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["**/*.g.*", "src/shadcn/**/*"],
  },
  {
    files: ["src/**/*"],
    rules: {
      curly: ["error", "all"],
      "no-console": "error",
      "no-restricted-imports": ["error", { patterns: ["../*", ".."] }],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
    },
  },
);

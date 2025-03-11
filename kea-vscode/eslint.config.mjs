import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
  },
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },

    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],

      curly: "error",
      eqeqeq: "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ThrowStatement",
          message: "Throwing errors is not allowed",
        },
      ],
      "prefer-const": "error",
      semi: "error",
    },
  },
];

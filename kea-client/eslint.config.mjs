// @ts-check

import eslint from "@eslint/js";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    plugins: {
      // @ts-expect-error - eslint-plugin-react-hooks is not typed
      "react-hooks": hooksPlugin,
    },
    // @ts-expect-error - eslint-plugin-react-hooks is not typed
    rules: hooksPlugin.configs.recommended.rules,
  },
  {
    ignores: ["**/*.g.*"],
  },
);

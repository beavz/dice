import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  ...nextConfig,
  { rules: jsxA11y.flatConfigs.recommended.rules },
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["dist/**", ".next/**", "out/**"],
  },
);

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory,
  recommendedConfig: js.configs.recommended,
});

const config = compat.config({
  env: {
    browser: true,
    es6: true,
    node: false,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:tailwindcss/recommended",
    "prettier",
  ],
  ignorePatterns: [
    "*.config.js",
    "*-config.cjs",
    "/public/service-worker.js",
  ],
  parserOptions: {
    ecmaVersion: 2022,
    project: ["./tsconfig.json"],
  },
  rules: {
    "no-empty": ["error", { allowEmptyCatch: true }],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-misused-promises": "warn",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/require-await": "off",
    "sort-imports": "off",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "@typescript-eslint/non-nullable-type-assertion-style": "warn",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-includes": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-reduce-type-parameter": "error",
    "@typescript-eslint/prefer-string-starts-ends-with": "error",
    "@typescript-eslint/promise-function-async": [
      "error",
      { checkArrowFunctions: false },
    ],
    "jsx-a11y/media-has-caption": 0,
    "lines-between-class-members": [
      "warn",
      "always",
      { exceptAfterSingleLine: true },
    ],
    "tailwindcss/classnames-order": [
      "warn",
      {
        officialSorting: true,
        config: "tailwind.config.js",
      },
    ],
    "react/no-unknown-property": [
      2,
      {
        ignore: ["jsx", "global"],
      },
    ],
  },
  settings: {
    tailwindcss: {
      config: "tailwind.config.js",
    },
  },
});

export default [...nextCoreWebVitals, ...config];

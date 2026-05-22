import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["node_modules/"],
  },
  ...compat.config({
    env: {
      es6: true,
      node: true,
    },
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    extends: [
      "eslint:recommended",
      "google",
    ],
    rules: {
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      "quotes": ["error", "double", {allowTemplateLiterals: true}],
    },
    overrides: [
      {
        files: ["**/*.spec.*"],
        env: {
          mocha: true,
        },
        rules: {},
      },
    ],
    globals: {},
  }),
];

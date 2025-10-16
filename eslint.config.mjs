import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import nodePlugin from "eslint-plugin-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("plugin:@typescript-eslint/recommended"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "node": nodePlugin,
    },

    languageOptions: {
        globals: {
            ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "commonjs",

        parserOptions: {
            ecmaFeatures: {
                modules: true,
            },
        },
    },

    settings: {
        "import/resolver": {
            typescript: {},
        },
    },

    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "error",

        "node/no-unpublished-import": ["error", {
            allowModules: ["@cfworker/json-schema", "dotenv"],
        }],

        "no-process-exit": "off",
        "no-sync": "off",
        "no-shadow": "off",
        "object-curly-spacing": "off",
        "comma-dangle": "off",
        "censor/no-swear": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "object-shorthand": "off",
    },
}]);

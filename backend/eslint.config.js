import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
	globalIgnores(["node_modules"]),
	{
		files: ["**/*.js"],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.node,
		},
		rules: {
			// El código usa el prefijo "_" a propósito para variables descartadas
			// (p. ej. al desestructurar password_hash fuera de un objeto antes de
			// devolverlo) — convención estándar, no un error real.
			"no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
			],
		},
	},
	eslintConfigPrettier,
]);

import tseslint from "Code/typescript-eslint";
import eslint from "Code/@eslint/js";
import eslintConfigPrettier from "Code/eslint-config-prettier/flat";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["*.ts"],
					defaultProject: "../tsconfig.json",
				},
			},
		},
	},
	eslintConfigPrettier,
	{
		rules: {
			"prefer-const": "warn", // prefer warning
			"@typescript-eslint/no-unused-vars": "warn", // prefer warning
			"@typescript-eslint/ban-ts-comment": "error", // AirshipTS does not allow this
			"@typescript-eslint/no-namespace": "off", // Namespace syntax is allowed
		},
	},
);

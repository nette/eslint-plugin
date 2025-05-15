import globals from 'globals';
import nette from '@nette/eslint-plugin/typescript';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.mocha,
			},
		},

		extends: [nette.configs.customize({ browser: false })],
	},

	{
		files: ['**/*.ts'],
		extends: [nette.configs.customize({ browser: false, typescript: true })],
	},
]);

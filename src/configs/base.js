import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
	{
		name: 'eslint/recommended',
		...js.configs.recommended,
	},

	{
		name: '@stylistic/custom',
		...stylistic.configs.customize({
			indent: 'tab',
			braceStyle: '1tbs',
			arrowParens: true,
			semi: true,
			jsx: false,
		}),
	},
];

import tseslint from 'typescript-eslint';

export default [
	{
		name: '@nette/typescript',

		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},

		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];

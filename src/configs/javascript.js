import stylistic from '@stylistic/eslint-plugin';
import plugin from '../plugin.js';

export default [
	{
		name: '@nette/javascript',

		plugins: {
			'@nette': plugin,
			'@stylistic': stylistic,
		},

		rules: {
			'@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
			'@stylistic/new-parens': ['error', 'never'],
			'@stylistic/padded-blocks': 'off',
			'@stylistic/indent-binary-ops': 'error',

			'@nette/no-this-in-arrow-except': 'error',
			'@nette/prefer-line-comments': 'error',

			'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
			'prefer-arrow-callback': 'error',
			'arrow-body-style': 'error',
			'eqeqeq': ['error', 'always', { null: 'ignore' }],
			'no-var': 'error',
			'prefer-const': 'off',
			'curly': 'error',
		},
	},
];

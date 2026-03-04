import stylistic from '@stylistic/eslint-plugin';

export default [
	{
		name: '@nette/jsx',
		files: ['**/*.jsx', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
	},
	{
		name: '@nette/jsx-rules',
		files: ['**/*.jsx', '**/*.tsx'],
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			'@stylistic/jsx-closing-bracket-location': 'error',
			'@stylistic/jsx-closing-tag-location': 'error',
			'@stylistic/jsx-curly-brace-presence': ['error', { propElementValues: 'always' }],
			'@stylistic/jsx-curly-newline': 'error',
			'@stylistic/jsx-curly-spacing': ['error', 'never'],
			'@stylistic/jsx-equals-spacing': 'error',
			'@stylistic/jsx-first-prop-new-line': 'error',
			'@stylistic/jsx-function-call-newline': ['error', 'multiline'],
			'@stylistic/jsx-indent-props': ['error', 'tab'],
			'@stylistic/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
			'@stylistic/jsx-one-expression-per-line': 'off',
			'@stylistic/jsx-quotes': 'error',
			'@stylistic/jsx-tag-spacing': ['error', {
				afterOpening: 'never',
				beforeClosing: 'never',
				beforeSelfClosing: 'always',
				closingSlash: 'never',
			}],
			'@stylistic/jsx-wrap-multilines': ['error', {
				arrow: 'parens-new-line',
				assignment: 'parens-new-line',
				condition: 'parens-new-line',
				declaration: 'parens-new-line',
				logical: 'parens-new-line',
				prop: 'parens-new-line',
				propertyValue: 'parens-new-line',
				return: 'parens-new-line',
			}],
			'@stylistic/jsx-self-closing-comp': ['error', { html: false }],
			'@stylistic/jsx-pascal-case': 'error',
		},
	},
];

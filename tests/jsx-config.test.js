import { describe, it } from 'mocha';
import assert from 'assert';
import plugin from '../src/index.js';
import tsPlugin from '../src/typescript.js';

describe('JSX Configuration', () => {
	it('should not include JSX config by default', () => {
		const hasJsx = plugin.configs.recommended.some((c) =>
			c.languageOptions?.parserOptions?.ecmaFeatures?.jsx,
		);
		assert(!hasJsx, 'JSX should not be enabled by default');
	});

	it('should include JSX config when jsx option is true', () => {
		const config = plugin.configs.customize({ jsx: true });
		const jsxConfig = config.find((c) =>
			c.languageOptions?.parserOptions?.ecmaFeatures?.jsx,
		);
		assert(jsxConfig, 'JSX configuration not found');
	});

	it('should scope JSX to .jsx and .tsx files', () => {
		const config = plugin.configs.customize({ jsx: true });
		const jsxConfig = config.find((c) =>
			c.languageOptions?.parserOptions?.ecmaFeatures?.jsx,
		);
		assert(jsxConfig.files, 'JSX config should have files constraint');
		assert(jsxConfig.files.includes('**/*.jsx'), 'Should include .jsx files');
		assert(jsxConfig.files.includes('**/*.tsx'), 'Should include .tsx files');
	});

	it('should work with TypeScript plugin', () => {
		const config = tsPlugin.configs.customize({ typescript: true, jsx: true });
		const jsxConfig = config.find((c) =>
			c.languageOptions?.parserOptions?.ecmaFeatures?.jsx,
		);
		assert(jsxConfig, 'JSX configuration not found in TypeScript setup');
	});

	it('should include @stylistic JSX rules when jsx is enabled', () => {
		const config = plugin.configs.customize({ jsx: true });
		const rulesConfig = config.find((c) => c.rules?.['@stylistic/jsx-quotes']);
		assert(rulesConfig, 'JSX style rules should be present');
	});

	it('should not include JSX rules by default', () => {
		const hasJsxRules = plugin.configs.recommended.some((c) =>
			c.rules?.['@stylistic/jsx-quotes'],
		);
		assert(!hasJsxRules, 'JSX rules should not be present by default');
	});

	it('should include jsx-self-closing-comp rule', () => {
		const config = plugin.configs.customize({ jsx: true });
		const rulesConfig = config.find((c) => c.rules?.['@stylistic/jsx-self-closing-comp']);
		assert(rulesConfig, 'jsx-self-closing-comp rule should be present');
	});

	it('should include jsx-pascal-case rule', () => {
		const config = plugin.configs.customize({ jsx: true });
		const rulesConfig = config.find((c) => c.rules?.['@stylistic/jsx-pascal-case']);
		assert(rulesConfig, 'jsx-pascal-case rule should be present');
	});
});

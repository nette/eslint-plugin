import { describe, it } from 'mocha';
import assert from 'assert';
import plugin from '../src/typescript.js';

describe('TypeScript Configuration', () => {
	it('should export TypeScript configuration', () => {
		assert(plugin.configs.typescript, 'TypeScript configuration is missing');
		assert(Array.isArray(plugin.configs.typescript), 'TypeScript configuration should be an array');
	});

	it('should include TypeScript parser and plugin', () => {
		const tsConfig = plugin.configs.typescript.find((config) =>
			config.plugins && config.plugins['@typescript-eslint'],
		);

		assert(tsConfig, 'TypeScript plugin not found in configuration');
		assert(tsConfig.languageOptions && tsConfig.languageOptions.parser, 'TypeScript parser not found');
	});

	it('should include TypeScript-specific rules', () => {
		const tsConfig = plugin.configs.typescript.find((config) =>
			config.rules && config.rules['@typescript-eslint/no-explicit-any'],
		);

		assert(tsConfig, 'TypeScript-specific rules not found');
	});
});

import { describe, it } from 'mocha';
import assert from 'assert';
import plugin from '../src/index.js';

describe('JavaScript Configuration', () => {
	it('should export JavaScript configuration', () => {
		assert(plugin.configs.recommended, 'JavaScript configuration is missing');
		assert(Array.isArray(plugin.configs.recommended), 'JavaScript configuration should be an array');
	});

	it('should include Stylistic plugin', () => {
		const jsConfig = plugin.configs.recommended.find((config) =>
			config.plugins && config.plugins['@stylistic'],
		);

		assert(jsConfig, 'Stylistic plugin not found in configuration');
	});

	it('should include Nette-specific rules', () => {
		const netteRules = [
			'@nette/no-this-in-arrow-except',
			'@nette/prefer-line-comments',
		];

		const hasAllNetteRules = netteRules.every((rule) => {
			const configWithRule = plugin.configs.recommended.find(
				(config) => config.rules && config.rules[rule] !== undefined,
			);
			return !!configWithRule;
		});

		assert(hasAllNetteRules, 'Not all Nette-specific rules found in JavaScript configuration');
	});

	it('should not include TypeScript rules by default', () => {
		const hasTypeScriptRules = plugin.configs.recommended.some((config) => {
			if (!config.rules) {
				return false;
			}
			return Object.keys(config.rules).some((rule) => rule.includes('@typescript-eslint'));
		});

		assert(!hasTypeScriptRules, 'JavaScript configuration should not include TypeScript rules');
	});

	it('should include basic ESLint rules', () => {
		const basicRules = [
			'no-unused-vars',
			'no-undef',
			'no-var',
		];

		const hasBasicRules = basicRules.some((rule) => {
			const configWithRule = plugin.configs.recommended.find(
				(config) => config.rules && config.rules[rule] !== undefined,
			);
			return !!configWithRule;
		});

		assert(hasBasicRules, 'Basic ESLint rules not found in JavaScript configuration');
	});

	it('should include appropriate language options', () => {
		const jsConfigWithLanguageOptions = plugin.configs.recommended.find((config) =>
			config.languageOptions && config.languageOptions.globals,
		);

		assert(jsConfigWithLanguageOptions, 'Language options not found in JavaScript configuration');
	});
});

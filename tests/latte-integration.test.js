import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import { ESLint } from 'eslint';
import stylistic from '@stylistic/eslint-plugin';
import nettePlugin from '../src/index.js';

describe('Latte Integration', () => {
	let eslint;

	beforeEach(() => {
		eslint = new ESLint({
			overrideConfigFile: true,
			overrideConfig: [
				{
					plugins: {
						nette: nettePlugin,
					},
					files: ['**/*.latte', '**/*.js.latte'],
					processor: 'nette/latte',
					rules: {
						'no-undef': 'error',
					},
					languageOptions: {
						globals: {
							console: 'readonly',
							document: 'readonly',
							alert: 'readonly',
						},
					},
				},
			],
		});
	});

	it('should lint JavaScript in .js.latte files', async () => {
		const code = `'use strict'

function foo() {
	console.log(1);
	document.getElementById('username').innerHTML = {$user['username']};
	console.log(2);
}`;

		const results = await eslint.lintText(code, { filePath: 'test.js.latte' });
		assert.strictEqual(results.length, 1);
		// Should not have errors because Latte tags are properly replaced
		assert.strictEqual(results[0].errorCount, 0);
	});

	it('should detect JavaScript errors after Latte processing', async () => {
		const code = `function test() {
	console.log(undefinedVariable);
	let value = {$someValue};
	console.log(value);
}`;

		const results = await eslint.lintText(code, { filePath: 'test.js.latte' });
		assert.strictEqual(results.length, 1);
		// Should detect undefined variable error
		assert.strictEqual(results[0].errorCount, 1);
		assert.strictEqual(results[0].messages[0].ruleId, 'no-undef');
	});

	it('should autofix around Latte tags without rewriting them', async () => {
		const fixer = new ESLint({
			overrideConfigFile: true,
			fix: true,
			overrideConfig: [
				{
					plugins: {
						'nette': nettePlugin,
						'@stylistic': stylistic,
					},
					files: ['**/*.latte'],
					processor: 'nette/latte',
					rules: {
						'@stylistic/space-infix-ops': 'error',
						'@stylistic/no-extra-parens': 'error',
						'@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
					},
				},
			],
		});
		const fix = async (code) => (await fixer.lintText(code, { filePath: 'test.js.latte' }))[0].output ?? code;

		assert.strictEqual(await fix('let x={$user};\n'), 'let x = {$user};\n');
		assert.strictEqual(await fix('let x = ({$y});\n'), 'let x = ({$y});\n');
		assert.strictEqual(await fix('foo();\n{if $x}\n{/if}\nbar();\n'), 'foo();\n{if $x}\n{/if}\nbar();\n');
	});

	it('should map suggestions back to the template', async () => {
		const linter = new ESLint({
			overrideConfigFile: true,
			overrideConfig: [
				{
					plugins: {
						nette: nettePlugin,
					},
					files: ['**/*.latte'],
					processor: 'nette/latte',
					rules: {
						'no-useless-escape': 'error',
					},
				},
			],
		});
		const code = 'let x = {$user}; let s = "\\.";';
		const [result] = await linter.lintText(code, { filePath: 'test.js.latte' });
		const { range, text } = result.messages[0].suggestions.find((suggestion) => suggestion.messageId === 'removeEscape').fix;

		assert.strictEqual(code.slice(0, range[0]) + text + code.slice(range[1]), 'let x = {$user}; let s = ".";');
	});
});

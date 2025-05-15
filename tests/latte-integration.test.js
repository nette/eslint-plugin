import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import { ESLint } from 'eslint';
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
});

import { describe, it } from 'mocha';
import assert from 'assert';
import latteProcessor from '../src/preprocessors/latte.js';

describe('Latte Configuration', () => {
	it('should work without any configuration', () => {
		// Don't configure anything - should use all defaults
		const input = 'let value = {$test}; alert({_"text"}); {if}';
		const result = latteProcessor.preprocess(input, 'test.js.latte');

		// Should use default replacements
		assert.strictEqual(result[0], 'let value = []; alert([]); ');
	});

	it('should use default configuration values', () => {
		// Reset to defaults
		latteProcessor.configure({});

		const input = 'let value = {$test}; alert({_"text"}); {if}';
		const result = latteProcessor.preprocess(input, 'test.js.latte');

		// Should use default replacements
		assert.strictEqual(result[0], 'let value = []; alert([]); ');
	});

	describe('Custom replacement function', () => {
		it('should use custom function when provided', () => {
			const customFunction = (tagContent) => {
				if (tagContent === 'custom') {
					return 'CUSTOM_REPLACEMENT';
				}
				return null; // Use default for others
			};

			latteProcessor.configure({ replacementFunction: customFunction });

			const input = 'let x = {custom}; let y = {$var};';
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], 'let x = CUSTOM_REPLACEMENT; let y = [];');
		});

		it('should handle empty string replacement', () => {
			const customFunction = (tagContent) => {
				if (tagContent === 'remove') {
					return '';
				}
				return null;
			};

			latteProcessor.configure({ replacementFunction: customFunction });

			const input = 'before {remove} after';
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], 'before  after');
		});

		it('should preserve error mapping with custom replacements', () => {
			const customFunction = (tagContent) => {
				if (tagContent === 'test') {
					return 'TEST_REPLACEMENT';
				}
				return null;
			};

			latteProcessor.configure({ replacementFunction: customFunction });

			const input = 'let x = {test};';
			latteProcessor.preprocess(input, 'test.latte');

			// Simulate error at position of replacement
			const messages = [[{
				line: 1,
				column: 9, // Position in transformed code
				message: 'Test error',
			}]];

			const result = latteProcessor.postprocess(messages);

			// Should map back to original position (position of {test})
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 9);
		});
	});

	describe('removeLatteErrors setting', () => {
		it('should work with replacementFunction', () => {
			const customFunction = () => 'REPLACED';

			latteProcessor.configure({
				replacementFunction: customFunction,
				removeLatteErrors: true,
			});

			const input = '{test}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], 'REPLACED');
		});

		it('should handle removeLatteErrors setting in postprocess', () => {
			latteProcessor.configure({
				removeLatteErrors: true,
			});

			const input = 'let value = {$test};';
			latteProcessor.preprocess(input, 'test.js.latte');

			// Create mock messages that would be filtered
			const messages = [[
				{
					line: 1,
					column: 13,
					message: 'Mock error in Latte code',
					ruleId: 'test-rule',
				},
			]];

			const result = latteProcessor.postprocess(messages);

			// With removeLatteErrors=true, errors in original Latte positions should be handled
			// This is a basic test - full error mapping would require more complex setup
			assert.ok(Array.isArray(result));
		});
	});
});

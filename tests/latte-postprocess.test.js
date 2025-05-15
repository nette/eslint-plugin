import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import latteProcessor from '../src/preprocessors/latte.js';

describe('Latte Postprocess', () => {
	beforeEach(() => {
		// Reset processor to default configuration before each test
		latteProcessor.configure({});
	});

	describe('Error Mapping', () => {
		it('should handle empty filtered content', () => {
			const messages = [[]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');
			assert.strictEqual(result.length, 0);
		});

		it('should return messages when no filtering occurred', () => {
			const input = 'console.log("test");';
			latteProcessor.preprocess(input, 'test.js.latte');
			const messages = [[
				{
					line: 1,
					column: 1,
					message: 'Test error',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].message, 'Test error');
		});

		it('should correctly map autofix ranges for simple case', () => {
			const input = 'let user = {$username};';
			latteProcessor.preprocess(input, 'test.js.latte');

			// Simulate autofix that inserts semicolon after the replacement
			const messages = [[
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 13,
					message: 'Missing semicolon',
					ruleId: 'semi',
					fix: {
						range: [13, 13], // Insert at end of "let user = []"
						text: ';',
					},
				},
			]];

			const result = latteProcessor.postprocess(messages, 'test.js.latte');
			assert.strictEqual(result[0].fix.range[0], 22);
			assert.strictEqual(result[0].fix.range[1], 22);
		});
	});

	describe('Postprocess Error Mapping', () => {
		it('should map errors correctly with single Latte tag', () => {
			const input = 'let username = {$user};';
			latteProcessor.preprocess(input, 'test.js.latte');

			const messages = [[
				{
					line: 1,
					column: 16, // Points to [] replacement
					endLine: 1,
					endColumn: 18,
					message: 'Test error',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 16); // Should map to start of {$user}
			assert.strictEqual(result[0].endLine, 1);
			assert.strictEqual(result[0].endColumn, 23); // Should map to end of {$user}
		});

		it('should map errors correctly with multiple Latte tags on same line', () => {
			const input = 'alert({$user} + {$message});';
			latteProcessor.preprocess(input, 'test.js.latte');

			// Error pointing to second replacement (column 12 in processed code "alert([] + []);")
			const messages = [[
				{
					line: 1,
					column: 12, // Points to second []
					endLine: 1,
					endColumn: 14,
					message: 'Test error',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 17); // Should map to start of {$message}
			assert.strictEqual(result[0].endLine, 1);
			assert.strictEqual(result[0].endColumn, 27); // Should map to end of {$message}
		});

		it('should map errors correctly with Latte tags across multiple lines', () => {
			const input = `let user = {$user};
let msg = {$message};
console.log(user, msg);`;
			latteProcessor.preprocess(input, 'test.js.latte');

			// Error on second line
			const messages = [[
				{
					line: 2,
					column: 11, // Points to "0" on second line
					endLine: 2,
					endColumn: 12,
					message: 'Test error',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 2);
			assert.strictEqual(result[0].column, 11); // Should map to start of {$message}
			assert.strictEqual(result[0].endLine, 2);
			assert.strictEqual(result[0].endColumn, 11); // Should map to end of {$message}
		});

		it('should handle complex line with mixed content and multiple tags', () => {
			const input = 'if ({$condition} && {$other}) { console.log({$result}); }';
			latteProcessor.preprocess(input, 'test.js.latte');

			// Error pointing to third tag
			const messages = [[
				{
					line: 1,
					column: 27, // Points to third "0" in processed: "if (0 && 0) { console.log(0); }"
					endLine: 1,
					endColumn: 28,
					message: 'Test error',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 43); // Should map to start of {$result}
			assert.strictEqual(result[0].endLine, 1);
			assert.strictEqual(result[0].endColumn, 44); // Should map to end of {$result}
		});

		it('should handle autofix range mapping', () => {
			const input = 'let x = {$user};';
			latteProcessor.preprocess(input, 'test.js.latte');

			const messages = [[
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 10,
					message: 'Test error',
					ruleId: 'test-rule',
					fix: {
						range: [8, 10], // Fix the [] character in processed code
						text: '1',
					},
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 9); // Should map to start of {$user}
			assert.strictEqual(result[0].fix.range[0], 8); // Should map to original position
			assert.strictEqual(result[0].fix.range[1], 15); // Should map to end of original {$user}
		});

		it('should handle errors before first Latte tag', () => {
			const input = 'let syntax error {$user};';
			latteProcessor.preprocess(input, 'test.js.latte');

			const messages = [[
				{
					line: 1,
					column: 5, // Points to "syntax" in original
					endLine: 1,
					endColumn: 11,
					message: 'Syntax error',
					ruleId: 'syntax-error',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 5); // Should remain unchanged
			assert.strictEqual(result[0].endLine, 1);
			assert.strictEqual(result[0].endColumn, 11); // Should remain unchanged
		});

		it('should filter out errors in Latte code when removeLatteErrors is true', () => {
			latteProcessor.configure({ removeLatteErrors: true });

			const input = 'console.log({$user.invalid.syntax});';
			latteProcessor.preprocess(input, 'test.js.latte');

			// Create an error that would be inside the original Latte tag position
			const messages = [[
				{
					line: 1,
					column: 13, // Points to "0" replacement in processed code
					endLine: 1,
					endColumn: 14,
					message: 'Error in Latte code',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			// Error should be filtered out since it maps back to Latte code
			assert.strictEqual(result.length, 0);
		});

		it('should handle multiple errors with different tag types', () => {
			const input = '{if $cond}let msg = {_"Hello"};{/if}';
			latteProcessor.preprocess(input, 'test.js.latte');

			const messages = [[
				{
					line: 1,
					column: 11, // Error in processed code (points to "0")
					endLine: 1,
					endColumn: 12,
					message: 'Error 1',
					ruleId: 'rule-1',
				},
				{
					line: 1,
					column: 1, // Error at start of processed code
					endLine: 1,
					endColumn: 2,
					message: 'Error 2',
					ruleId: 'rule-2',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 2);
			// First error should map to {_"Hello"} position
			assert.strictEqual(result[0].column, 21);
			// Second error should map back correctly
			assert.strictEqual(result[1].column, 11); // After {if $cond}
		});

		it('should handle edge case with consecutive Latte tags', () => {
			const input = 'alert({$a}{$b}{$c});';
			latteProcessor.preprocess(input, 'test.js.latte');

			// Error pointing to middle tag
			const messages = [[
				{
					line: 1,
					column: 8, // Points to second "0" in "alert(000);"
					endLine: 1,
					endColumn: 9,
					message: 'Test error',
					ruleId: 'test-rule',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 1);
			assert.strictEqual(result[0].column, 7); // Should map to start of {$b}
			assert.strictEqual(result[0].endLine, 1);
			assert.strictEqual(result[0].endColumn, 11); // Should map to end of {$b}
		});

		it('should handle error in content after removed Latte tags', () => {
			const input = `{if $cond}
console.log("test");
{/if}
syntax error here`;
			latteProcessor.preprocess(input, 'test.js.latte');

			// Error on last line in processed code
			const messages = [[
				{
					line: 4, // Line number in processed code
					column: 1,
					endLine: 4,
					endColumn: 7,
					message: 'Syntax error',
					ruleId: 'syntax-error',
				},
			]];
			const result = latteProcessor.postprocess(messages, 'test.js.latte');

			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].line, 4); // Should map to line 4 in original
			assert.strictEqual(result[0].column, 1);
		});
	});
});

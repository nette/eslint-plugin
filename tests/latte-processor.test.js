import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import latteProcessor from '../src/preprocessors/latte.js';

describe('Latte Processor', () => {
	beforeEach(() => {
		// Reset processor to default configuration before each test
		latteProcessor.configure({});
	});

	describe('File Type Detection', () => {
		it('should detect JavaScript Latte files', () => {
			const result = latteProcessor.preprocess('console.log(\'test\');', 'test.js.latte');
			assert.strictEqual(result.length, 1);
		});

		it('should detect CSS Latte files', () => {
			const result = latteProcessor.preprocess('body { color: red; }', 'test.css.latte');
			assert.strictEqual(result.length, 1);
		});

		it('should detect text Latte files', () => {
			const result = latteProcessor.preprocess('Hello world', 'test.txt.latte');
			assert.strictEqual(result.length, 1);
		});

		it('should detect HTML Latte files', () => {
			const result = latteProcessor.preprocess('<div>test</div>', 'test.latte');
			assert.strictEqual(result.length, 1);
		});

		it('should ignore non-Latte files', () => {
			const result = latteProcessor.preprocess('console.log(\'test\');', 'test.js');
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0], 'console.log(\'test\');');
		});
	});

	describe('Default replacement behavior', () => {
		it('should handle all default tag types correctly', () => {
			const input = '{$variable} {=expression} {_translation} {if} {/if} {foreach}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			// Control structures {if}, {/if}, {foreach} are replaced with empty string
			// so spaces between them remain: '[] [] []   '
			assert.strictEqual(result[0], '[] [] []   ');
		});

		it('should handle special bracket tags', () => {
			const input = '{l} and {r}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], '{ and }');
		});

		it('should handle edge cases in tag content', () => {
			const input = '{$} {=} {_} {/}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			// Control structure {/} is replaced with empty string
			// so space before it remains: '[] [] [] '
			assert.strictEqual(result[0], '[] [] [] ');
		});

		it('should handle tags that start with special keywords', () => {
			const input = '{control foo} {link bar} {plink baz} {asset style.css}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			// All should be replaced with empty string since they start with keywords
			assert.strictEqual(result[0], '[] [] [] []');
		});

		it('should handle keywords followed by word characters', () => {
			const input = '{controller} {linkage} {plinkage} {assets}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			// These should be removed (not replaced with 0) since they don't match exact keywords
			assert.strictEqual(result[0], '   ');
		});

		it('should handle function calls', () => {
			const input = '{foo()} {bar($arg)} {myFunc(1,2,3)}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			// Function calls should be replaced with empty string
			assert.strictEqual(result[0], '[] [] []');
		});

		it('should handle expressions and variables with content', () => {
			const input = '{$user.name} {=expr + 1} {_"Hello world"} {Foo\Bar::Const}';
			const result = latteProcessor.preprocess(input, 'test.latte');

			// Should be replaced with empty string since they start with $, =, _
			assert.strictEqual(result[0], '[] [] [] []');
		});

		it('should handle multiline tags', () => {
			const input = `before {$multiline
with newlines} after`;
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], 'before [] after');
		});

		it('should handle complex mixed content', () => {
			const input = `console.log(1);
{if !empty($user)}
document.getElementById('username').innerHTML = {$user['username']};
{/if}
console.log(2);`;
			const result = latteProcessor.preprocess(input, 'test.js.latte');
			const expected = `console.log(1);

document.getElementById('username').innerHTML = [];

console.log(2);`;
			assert.strictEqual(result[0], expected);
		});
	});

	describe('Whitespace', () => {
		it('should remove leading whitespace for empty replacement on standalone line', () => {
			const input = 'line1\n    {remove}\nline3';
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], 'line1\n\nline3');
		});

		it('should not remove whitespace if tag is not standalone', () => {
			const input = 'line1\n    {remove} text\nline3';
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], 'line1\n     text\nline3');
		});

		it('should handle multiple standalone empty replacements', () => {
			const input = `line1
	{remove1}
		{remove2}
	{$keep}
line5`;
			const result = latteProcessor.preprocess(input, 'test.latte');

			assert.strictEqual(result[0], `line1\n\n\n\t[]\nline5`);
		});
	});

	describe('Not Latte', () => {
		it('should handle nested braces in Latte tags', () => {
			const input = 'console.log({$array["key"]["nested"]});';
			const result = latteProcessor.preprocess(input, 'test.js.latte');
			const expected = 'console.log([]);';
			assert.strictEqual(result[0], expected);
		});

		it('should ignore empty Latte tags', () => {
			const input = 'console.log({});';
			const result = latteProcessor.preprocess(input, 'test.js.latte');
			// Empty {} should not be treated as Latte tag
			assert.strictEqual(result[0], input);
		});

		it('should ignore JSON', () => {
			const input = 'console.log({\'a\': 123});';
			const result = latteProcessor.preprocess(input, 'test.js.latte');
			// Empty {} should not be treated as Latte tag
			assert.strictEqual(result[0], input);
		});
	});

	describe('n:syntax="off" Detection', () => {
		it('should ignore Latte tags in syntax="off" regions', () => {
			const input = `<script n:syntax="off">
function test() {
	let a = {if: 1};
	console.log({test: true});
}
</script>`;
			const result = latteProcessor.preprocess(input, 'test.latte');
			// Tags should remain unchanged
			assert.strictEqual(result[0], input);
		});

		it('should handle different n:syntax attribute', () => {
			const input = `<script  n:syntax = off type="module">
{if $test}
console.log('test');
{/if}
</script>`;
			const result = latteProcessor.preprocess(input, 'test.latte');
			// Should ignore Latte tags due to syntax off
			assert.strictEqual(result[0], input);
		});

		it('should process Latte tags outside syntax="off" regions', () => {
			const input = `<script>
{if $user}
console.log({$user.name});
{/if}
</script>
<script type="module" n:syntax=off>
let obj = {if: true};
</script>`;
			const result = latteProcessor.preprocess(input, 'test.latte');
			const expected = `<script>

console.log([]);

</script>
<script type="module" n:syntax=off>
let obj = {if: true};
</script>`;
			assert.strictEqual(result[0], expected);
		});
	});
});

import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import latteProcessor from '../src/preprocessors/latte.js';

describe('Latte Comments', () => {
	beforeEach(() => {
		latteProcessor.configure({});
	});

	it('should remove single-brace comments', () => {
		const input = 'let a = 1; {* comment *} let b = 2;';
		const result = latteProcessor.preprocess(input, 'test.js.latte');
		assert.strictEqual(result[0], 'let a = 1;  let b = 2;');
	});

	it('should remove multiline comments', () => {
		const input = 'let a = {* line1\nline2 *} 1;';
		const result = latteProcessor.preprocess(input, 'test.js.latte');
		assert.strictEqual(result[0], 'let a =  1;');
	});

	it('should remove comments containing tag-like content', () => {
		const input = 'x = {* {$y} *};';
		const result = latteProcessor.preprocess(input, 'test.js.latte');
		assert.strictEqual(result[0], 'x = ;');
	});

	it('should strip leading whitespace for standalone comments', () => {
		const input = 'line1\n\t{* c *}\nline3';
		const result = latteProcessor.preprocess(input, 'test.latte');
		assert.strictEqual(result[0], 'line1\n\nline3');
	});

	it('should remove double-brace comments in syntax=double regions', () => {
		const input = '<script n:syntax="double">\nlet a = {{* c *}} 1;\n</script>';
		const result = latteProcessor.preprocess(input, 'test.latte');
		assert.strictEqual(result[0], '<script n:syntax="double">\nlet a =  1;\n</script>');
	});
});

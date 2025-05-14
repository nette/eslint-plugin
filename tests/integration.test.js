import path from 'path';
import { fileURLToPath } from 'url';
import { ESLint } from 'eslint';
import assert from 'assert';
import nette from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Increase timeout for ESLint tests
const TEST_TIMEOUT = 10000;

describe('ESLint plugin @nette/eslint-plugin integration', function () {
	// Set timeout for all tests in this suite
	this.timeout(TEST_TIMEOUT);

	it('should lint a valid file without errors from our rules', async () => {
		// This test confirms basic linting works
		const eslint = new ESLint({
			baseConfig: {
				languageOptions: {
					sourceType: 'module',
					ecmaVersion: 2022,
				},
				plugins: {
					'@nette': nette,
				},
				rules: {
					'@nette/prefer-line-comments': 'error',
					// Disable other rules to avoid unrelated errors
					'no-unused-vars': 'off',
				},
			},
			cwd: __dirname,
		});

		const validCode = `// This is a line comment
const x = 1;
x;
`;
		const [result] = await eslint.lintText(validCode, { filePath: 'test.js' });

		if (result.errorCount !== 0) {
			console.error('ESLint messages:', result.messages);
		}
		assert.strictEqual(result.errorCount, 0, `Expected 0 errors, but got ${result.errorCount}`);
	});

	it('should detect invalid comments with individual rule', async () => {
		// This tests using individual rules as shown in usage.md example 1
		const eslint = new ESLint({
			baseConfig: {
				languageOptions: {
					sourceType: 'module',
					ecmaVersion: 2022,
				},
				plugins: {
					'@nette': nette,
				},
				rules: {
					'@nette/prefer-line-comments': 'error',
					// Disable other rules to avoid unrelated errors
					'no-unused-vars': 'off',
				},
			},
			cwd: __dirname,
		});

		const invalidCode = `/* This is a block comment */
const x = 1;
`;
		const [result] = await eslint.lintText(invalidCode, { filePath: 'test.js' });

		// Check specifically for our rule
		const netteErrors = result.messages.filter((msg) =>
			msg.ruleId === '@nette/prefer-line-comments',
		);

		assert.strictEqual(netteErrors.length, 1, 'Expected 1 error for block comment from our rule');
		assert.strictEqual(netteErrors[0].ruleId, '@nette/prefer-line-comments');
	});
});

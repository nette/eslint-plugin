import { RuleTester } from 'eslint';
import rule from '../src/rules/prefer-line-comments.js';

const ruleTester = new RuleTester;

ruleTester.run('prefer-line-comment', rule, {
	valid: [
		'// correct line comment\nconst a = 1;',

		`/*
           multiline
           block comment
        */
        const b = 2;`,

		'/** One-line JSDoc is allowed */\nfunction foo() {}',

		`/**
          * Multi-line JSDoc
          */
        const c = 3;`,
	],
	invalid: [
		{
			code: '/* wrong */\nconst a = 1;',
			output: '// wrong\nconst a = 1;',
			errors: [{ messageId: 'preferLine' }],
		},
		{
			code: '/*another*/\nlet x = 0;',
			output: '// another\nlet x = 0;',
			errors: [{ messageId: 'preferLine' }],
		},
	],
});

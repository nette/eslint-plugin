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

		// code follows the comment on the same line -> // would swallow it
		'const a = 1; /* tail */ const b = 2;',
		'foo(/* inline */ arg);',
		'/* leading */ const x = 1;',

		// ESLint directives keep their /* */ meaning
		'/* eslint-disable no-undef */\nfoo();',
		'/* eslint-enable */\nfoo();',
		'/* global window */\nwindow;',
		'/* globals a, b */\na; b;',
		'/* exported foo */\nfunction foo() {}',

		// coverage hints, tooling annotations / preserved licenses
		'/* c8 ignore next */\nfoo();',
		'const f = /*#__PURE__*/ foo();',
		'import(/* webpackChunkName: "x" */ "./x.js");',
		'/*! preserved license */\nconst a = 1;',
		'const g = /* @__PURE__ */ bar();',
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
		// trailing comment with nothing after it is safe to convert
		{
			code: 'const a = 1; /* tail */',
			output: 'const a = 1; // tail',
			errors: [{ messageId: 'preferLine' }],
		},
		// only the last of several comments on a line can become //
		{
			code: 'const a = 1; /* one */ /* two */',
			output: 'const a = 1; /* one */ // two',
			errors: [{ messageId: 'preferLine' }],
		},
	],
});

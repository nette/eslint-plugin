import { RuleTester } from 'eslint';
import rule from '../src/rules/no-this-in-arrow-except-nested.js';

const ruleTester = new RuleTester;

// 1) Default behavior (allowNestedInFunction: false)
ruleTester.run('no-this-in-arrow-except (default)', rule, {
	valid: [
		// `this` in a class method → always OK
		{
			code: `
                class Foo {
                    init() {
                        this.value;
                    }
                }
            `,
		},
		// arrow inside a class method → always OK
		{
			code: `
                class Foo {
                    init() {
                        $(() => {
                            this.value;
                        });
                    }
                }
            `,
		},
		// jQuery callback as FunctionExpression → OK
		{
			code: `
                $(() => {
                    $(function () {
                        this.value;
                    });
                });
            `,
		},
	],
	invalid: [
		// top-level arrow → error
		{
			code: `
                const a = () => {
                    this.value;
                };
            `,
			errors: [{ messageId: 'noThisInArrowWithException' }],
		},
		// arrow in function → error
		{
			code: `
                $(() => {
                    this.value;
                });
            `,
			errors: [{ messageId: 'noThisInArrowWithException' }],
		},
		// arrow inside a regular function → error (default)
		{
			code: `
                function outer() {
                    const a = () => {
                        this.value;
                    };
                }
            `,
			errors: [{ messageId: 'noThisInArrowWithException' }],
		},
	],
});

// 2) Opt-in behavior (allowNestedInFunction: true)
ruleTester.run(
	'no-this-in-arrow-except (allowNestedInFunction)',
	rule,
	{
		valid: [
			// now arrow inside a regular function is allowed
			{
				code: `
                    function outer() {
                        const a = () => {
                            this.value;
                        };
                    }
                `,
				options: [{ allowNestedInFunction: true }],
			},
		],
		invalid: [
			// top-level arrow still errors
			{
				code: `
                    const a = () => {
                        this.bar();
                    };
                `,
				options: [{ allowNestedInFunction: true }],
				errors: [{ messageId: 'noThisInArrow' }],
			},
			// delegate-style arrow with this still errors
			{
				code: `
                $(() => {
                    this.value;
                });
                `,
				options: [{ allowNestedInFunction: true }],
				errors: [{ messageId: 'noThisInArrow' }],
			},
		],
	},
);

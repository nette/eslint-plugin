import { RuleTester } from 'eslint';
import rule from '../src/rules/no-this-in-arrow-except.js';

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
		// class field initializer arrow (bound method) → `this` is the instance → OK
		{
			code: `
                class Foo {
                    handler = () => {
                        this.value;
                    };
                }
            `,
		},
		// nested arrow inside a class field initializer → still the instance → OK
		{
			code: `
                class Foo {
                    handler = () => [].map(() => this.value);
                }
            `,
		},
		// arrow callback inside an object shorthand method → OK
		{
			code: `
                const obj = {
                    foo() {
                        [].map(() => this.value);
                    },
                };
            `,
		},
		// arrow inside a class static block → `this` is the class → OK
		{
			code: `
                class Foo {
                    static {
                        [].map(() => this.value);
                    }
                }
            `,
		},
		// class field of a class declared inside an arrow → `this` is the instance → OK
		{
			code: `
                const make = () => class {
                    value = this.other;
                };
            `,
		},
	],
	invalid: [
		// arrow as an object literal property value → `this` is NOT the object → error
		{
			code: `
                const obj = {
                    foo: () => {
                        this.value;
                    },
                };
            `,
			errors: [{ messageId: 'noThisInArrowWithException' }],
		},
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
			// class field initializer arrow → the instance → allowed
			{
				code: `
                    class Foo {
                        handler = () => {
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

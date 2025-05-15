# @nette/eslint-plugin

[![npm version](https://img.shields.io/npm/v/@nette/eslint-plugin.svg)](https://www.npmjs.com/package/@nette/eslint-plugin)
![License](https://img.shields.io/npm/l/@nette/eslint-plugin.svg)

An ESLint plugin with custom rules and shareable configuration for Nette-specific JavaScript and TypeScript linting.

Installation
============

```bash
npm install --save-dev @nette/eslint-plugin eslint
```

For TypeScript support, you will also need these additional dependencies:

```bash
npm install --save-dev typescript typescript-eslint
```

 <!---->

Features
========

This plugin provides two custom rules to improve code quality:

- **no-this-in-arrow-except**: Prevents using `this` inside arrow functions with configurable exceptions
- **prefer-line-comments**: Enforces line comments (`//`) over block comments (`/* */`) for single-line comments

 <!---->

Usage
=====

Add `@nette/eslint-plugin` to your ESLint configuration.

### Using Recommended Configuration

```js
// eslint.config.js
import nette from '@nette/eslint-plugin';

export default defineConfig([
	{
		extends: [nette.configs.recommended],
		// ...your other config items
	},
];
```

Using TypeScript Configuration
------------------------------

Import from typescript entrypoint:

```js
// eslint.config.js
import nette from '@nette/eslint-plugin/typescript';

export default defineConfig([
	{
		extends: [nette.configs.typescript],
		// ...your other config items
	},
]);
```

Customizing Configuration
------------------------

```js
export default defineConfig([
	{
		extends: [nette.configs.customize({
			browser: true,    // Include browser globals (default: true)
			typescript: true, // Include TypeScript support (default: false)
		})],
		// ...your other config items
	},
]);
```

Using Rules
-----------

```js
// eslint.config.js
import nette from '@nette/eslint-plugin';

export default defineConfig([
	{
		plugins: {
			'@nette': nette
		},

		rules: {
			'@nette/no-this-in-arrow-except': 'error',
			'@nette/prefer-line-comments': 'error'
		},
	},
]);
```

 <!---->

Rule Details
============

no-this-in-arrow-except
-----------------------

Prevents using `this` in arrow functions with exceptions for specific cases. It has two modes:

1. **Default mode** (`allowNestedInFunction: false`):
	 - Allows `this` in arrow functions only when they are callbacks in class methods or directly passed to function calls

2. **Opt-in mode** (`allowNestedInFunction: true`):
	 - Also allows `this` in arrow functions when nested within any regular function

Example configuration:

```js
{
	rules: {
		'@nette/no-this-in-arrow-except': ['error', { allowNestedInFunction: true }]
	}
}
```

prefer-line-comments
--------------------

Enforces the use of line comments (`//`) instead of block comments (`/* */`) for single-line comments.
Exceptions are made for:
- Multi-line block comments
- JSDoc comments (block comments starting with `*`)

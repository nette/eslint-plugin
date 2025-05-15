# @nette/eslint-plugin

[![npm version](https://img.shields.io/npm/v/@nette/eslint-plugin.svg)](https://www.npmjs.com/package/@nette/eslint-plugin)
![License](https://img.shields.io/npm/l/@nette/eslint-plugin.svg)

An ESLint plugin with custom rules and shareable configuration for Nette-specific JavaScript and TypeScript linting, including support for Latte template files.

Installation
============

```bash
npm install --save-dev @nette/eslint-plugin eslint
```

For TypeScript support, you will also need these additional dependencies:

```bash
npm install --save-dev typescript typescript-eslint
```

For Latte template support (HTML files with embedded JavaScript), you will also need:

```bash
npm install --save-dev eslint-plugin-html
```

 <!---->

Features
========

This plugin provides custom rules and configurations to improve code quality:

### Custom Rules
- **no-this-in-arrow-except**: Prevents using `this` inside arrow functions with configurable exceptions
- **prefer-line-comments**: Enforces line comments (`//`) over block comments (`/* */`) for single-line comments

### Latte Template Support
- **Latte Processor**: Processes Latte template files to lint JavaScript code within templates
- **File Type Support**: `.js.latte`, `.css.latte`, `.txt.latte`, `.latte` files
- **n:syntax="off"**: Respects syntax disable attribute in HTML elements

 <!---->

Usage
=====

Add `@nette/eslint-plugin` to your ESLint configuration.

### Using Recommended Configuration

```js
// eslint.config.js
import nette from '@nette/eslint-plugin';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		extends: [nette.configs.recommended],
		// ...your other config items
	},
]);
```

Using Latte Configuration
------------------------

The [eslint-plugin-html](https://www.npmjs.com/package/eslint-plugin-html) plugin is used to check JavaScript inside `<script>` tags in HTML pages. This package provides you with a preprocessor that allows you to use Latte tags inside JavaScript, for example:

```latte
<script>
let name = {$name};
</script>
```

Use this configuration:

```js
import nette from '@nette/eslint-plugin';
import pluginHtml from 'eslint-plugin-html';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['app/**/*.latte'],

		plugins: {
			html: pluginHtml,       // Enables eslint-plugin-html
		},
		processor: '@nette/latte',  // Enabled Latte preprocessor
	},
]);
```


Using TypeScript Configuration
------------------------------

Import from typescript entrypoint:

```js
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
import nette from '@nette/eslint-plugin';
import { defineConfig } from 'eslint/config';

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

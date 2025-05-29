# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

@nette/eslint-plugin is an ESLint configuration package with custom rules for Nette-specific JavaScript linting. The project is structured as an ESLint plugin and config, using the new flat configuration format. It supports both JavaScript and TypeScript, and includes a processor for Latte template files.

## Common Commands

```bash
# Run all tests
npm run test

# Run linter
npm run lint

# Run linter with autofix
npm run lint:fix

# Run a specific test file
npx mocha tests/prefer-line-comments.test.js
```

## Code Architecture

The codebase is structured as follows:

1. **ESLint Plugin** (`src/plugins.js`): Exports the plugin configuration, including metadata and custom rules.

2. **Custom Rules** (`src/rules/`): Individual rule implementations, each exported with `meta` and `create` functions:
   - `no-this-in-arrow-except-nested.js`: Prevents using `this` inside arrow functions with configurable exceptions
   - `prefer-line-comments.js`: Enforces line comments (`//`) over block comments (`/* */`) for single-line comments

3. **Configs** (`src/configs/`): Configuration options for various environments:
   - `base.js`: Base ESLint configuration settings
   - `nette.js`: Nette-specific rules and configuration
   - `recommended.js`: Exports the combined recommended configuration for JavaScript
   - `typescript.js`: TypeScript-specific configuration extending the base and recommended settings

4. **Latte Processor** (`src/latte-processor.js`): Processes Latte template files to extract and lint JavaScript code:
   - Handles different file types (.js.latte, .css.latte, .txt.latte, .latte)
   - Recognizes Latte syntax: `{$variable}`, `{=expression}`, `{_translation}`, `{control}`
   - Supports `n:syntax="off"` attribute to disable Latte processing in HTML elements
   - Maps ESLint errors back to original file locations
   - Configurable replacement values for different Latte constructs
   - Supports partial configuration with object spread merging

5. **Entry Point** (`src/index.js`): Main entry point that exports the plugin and configurations:
   - Exports the plugin from `plugins.js`
   - Includes the Latte processor under `processors.latte`
   - Makes configurations available under `configs` namespace
   - Supports both JavaScript (recommended) and TypeScript configurations
   - Provides dedicated `latte` configuration for Latte template files
   - Includes `configureLatte()` factory function for custom Latte configurations
   - Configures processor with default settings on initialization

6. **Tests** (`tests/`): Each rule has a corresponding test file using ESLint's `RuleTester`, plus integration tests:
   - Rule-specific tests: `no-this-except.test.js` and `prefer-line-comments.test.js`
   - Integration tests: `integration.test.js` for general plugin testing
   - Configuration tests: `javascript-config.test.js` and `typescript-config.test.js` for testing configs
   - Latte processor tests: `latte-processor.test.js` and `latte-integration.test.js`
   - Latte configuration tests: `latte-configuration.test.js` and `latte-config-integration.test.js`
   - Fixture files: `tests/fixtures/` contains sample Latte files for testing

## Rule Details

### no-this-in-arrow-except

Prevents using `this` in arrow functions with exceptions for specific cases. It has two modes:

1. **Default mode** (`allowNestedInFunction: false`):
   - Allows `this` in arrow functions only when they are callbacks in class methods or directly passed to function calls

2. **Opt-in mode** (`allowNestedInFunction: true`):
   - Also allows `this` in arrow functions when nested within any regular function

### prefer-line-comments

Enforces the use of line comments (`//`) instead of block comments (`/* */`) for single-line comments.
Exceptions are made for:
- Multi-line block comments
- JSDoc comments (block comments starting with `*`)

## Latte Template Support

The plugin includes a processor for Latte template files that allows ESLint to lint JavaScript code within Latte templates:

### Supported File Types
- `**/*.js.latte` - JavaScript files with Latte syntax
- `**/*.css.latte` - CSS files with Latte syntax
- `**/*.txt.latte` - Text files with Latte syntax
- `**/*.latte` - HTML files with Latte syntax

### Latte Syntax Recognition
The processor recognizes and handles these Latte constructs:
- `{$variable}` - Variables, replaced with `0` placeholder
- `{=expression}` - Expressions, replaced with `0` placeholder
- `{_"text"}` - Translations, replaced with `""` placeholder
- `{if}`, `{/if}`, `{foreach}`, etc. - Control structures, removed completely
- `n:syntax="off"` - Disables Latte processing within HTML elements

### Usage

**Basic usage with defaults:**
```javascript
import nette from '@nette/eslint-plugin';

export default [
  ...nette.configs.latte
];
```

**Custom configuration:**
```javascript
import nette from '@nette/eslint-plugin';

export default [
  ...nette.configs.configureLatte({
    latteReplacement: {
      expression: 'undefined',      // Replace {$var} with 'undefined'
      translation: "'__missing__'", // Replace {_text} with '__missing__'
      control: '/* removed */'      // Replace {if} with '/* removed */'
    },
    removeLatteErrors: true,        // Filter out ESLint errors from Latte code
    keepEOL: false                  // Remove newlines after Latte tags (default)
  })
];
```

**Partial configuration (only specify what you want to change):**
```javascript
export default [
  ...nette.configs.configureLatte({
    latteReplacement: {
      expression: 'null'   // Only change expression replacement
      // translation and control use defaults: '""' and ''
    },
    keepEOL: true
  })
];
```

**Available configuration functions:**
- `nette.configs.latte` - Default Latte configuration
- `nette.configs.configureLatte(options)` - Custom Latte configuration factory

### Configuration Options

- **latteReplacement** (`object`) - Replacement values for different Latte constructs. You can specify only the options you want to change:
  - **expression** (`string`, default: `'0'`) - Replacement for variable and expression tags `{$var}`, `{=expr}`
  - **translation** (`string`, default: `'""'`) - Replacement for translation tags `{_text}`
  - **control** (`string`, default: `''`) - Replacement for control structures `{if}`, `{/if}`, etc.
- **removeLatteErrors** (`boolean`, default: `false`) - Whether to filter out ESLint errors that occur in original Latte code positions
- **keepEOL** (`boolean`, default: `false`) - Whether to preserve newlines after Latte tags (useful for debugging)

### Dependencies

For basic Latte support (`.js.latte`, `.css.latte`, `.txt.latte`):
- No additional dependencies required

For HTML Latte support (`.latte` files with `<script>` tags):
- Requires `eslint-plugin-html` to be installed

### Implementation Details

1. **Processor Architecture**: Uses ESLint's processor API to transform Latte files before linting
2. **Configuration System**: Supports both global configuration via `latteProcessor.configure()` and per-config options
3. **Partial Configuration**: Uses object spread to merge user settings with defaults, allowing partial overrides
4. **Error Mapping**: Maps ESLint errors back to original file positions accounting for Latte tag transformations
5. **Whitespace Handling**: When control structures or empty replacement tags are on lines containing only whitespace, the processor removes the leading whitespace from those lines while preserving the line structure
6. **Test Coverage**: 65+ tests covering all functionality including edge cases and configuration scenarios

### Limitations
- Currently focuses on `.js.latte` files for full JavaScript linting experience
- HTML parsing for `.latte` files requires `eslint-plugin-html` for complete functionality
- Error mapping preserves original line/column positions from Latte templates
- Global processor configuration means all instances of the processor share the same settings
- Regex-based parsing may not handle extremely complex nested Latte constructs

## TypeScript Support

The plugin provides TypeScript support through dedicated configuration:

1. **TypeScript Config**: Available as `nette.configs.typescript` in the API
2. **Integration**: Integrates with `typescript-eslint` to provide TypeScript-aware linting
3. **Rule Compatibility**: All Nette rules work in TypeScript files
4. **Optional Dependency**: TypeScript support is optional and the package will work without TypeScript installed. Import from '@nette/eslint-plugin/typescript' to use TypeScript support directly.
5. **Direct Import**: TypeScript configuration is available through a dedicated entry point via `import nette from '@nette/eslint-plugin/typescript'`. The customize function with `typescript: true` is no longer supported.

## Testing Notes

1. **TypeScript Rule Conflicts**: When running tests, TypeScript rules might interfere with test assertions. To avoid this:
   - In test files, explicitly disable TypeScript rules like `@typescript-eslint/no-unused-vars` and `@typescript-eslint/no-unused-expressions`
   - Use `console.log()` for variables to prevent unused variable warnings
   - Consider adding assertions that account for both JavaScript and TypeScript rule violations

2. **Integration Tests**: The integration test expects specific error counts:
   - For `no-this-in-arrow-except`: Counts each `this` reference in an arrow function
   - For `prefer-line-comments`: Looks for single-line block comments

3. **Latte Processor Tests**: Special considerations for Latte processor testing:
   - Use `beforeEach()` to reset processor configuration between tests to avoid test interference
   - Test configuration changes by calling `latteProcessor.configure()` with test-specific settings
   - Verify both `preprocess()` output (transformed code) and `postprocess()` behavior (error mapping)
   - Test edge cases like empty files, syntax-off regions, and partial configurations
   - Integration tests should verify the processor works with actual ESLint configurations

## Implementation Notes

1. The rule name in `plugins.js` is `no-this-in-arrow-except` but the file name is `no-this-in-arrow-except-nested.js`.

2. The project uses ESLint v9 and the new flat config format, requiring Node.js v16.0.0 or higher.

3. When testing with TypeScript configurations, make sure to have `typescript` and `typescript-eslint` installed.

4. **Optional TypeScript Support**: The package is designed to work without TypeScript installed:
   - `index.js` uses top-level await to dynamically import TypeScript configuration
   - When TypeScript dependencies are missing, accessing `nette.configs.typescript` will throw a helpful error
   - For environments without top-level await support, an alternative implementation is provided in `index-no-await.js`

5. **Latte Processor Implementation**:
   - Uses regex `/\{(?:[a-zA-Z_$\\/][^}]*)\}(\r?\n)?/g` to detect Latte tags
   - Employs global configuration via `_globalSettings` variable for processor state
   - Configuration merging uses object spread: `{...defaults, ...userSettings}`
   - Error mapping preserves original file positions through coordinate transformation
   - Supports different file types through filename-based detection

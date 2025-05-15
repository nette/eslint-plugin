/**
 * @nette/eslint-plugin/typescript
 *
 * ESLint plugin with custom rules for Nette-specific linting with TypeScript support
 */

import plugin from './plugins.js';
import jsConfig from './configs/javascript.js';
import tsConfig from './configs/typescript.js';
import baseConfig from './configs/base.js';
import browserConfig from './configs/browser.js';
import tseslint from 'typescript-eslint';

/**
 * Configuration factory for creating custom ESLint configurations
 *
 * @param {Object} options Configuration options
 * @param {boolean} [options.browser=true] Whether to include browser globals
 * @param {boolean} [options.typescript=false] Whether to include TypeScript support
 * @returns {Array} ESLint configuration array
 */
function customize(options = {}) {
	return [
		...baseConfig,
		...((options.browser ?? true) ? browserConfig : []),
		...tseslint.configs.recommended,
		...jsConfig,
		...(options.typescript ? tsConfig : []),
	];
}

// Clone the plugin to avoid mutating the original
let tsPlugin = {
	meta: { ...plugin.meta },
	rules: { ...plugin.rules },
};

tsPlugin.configs = {
	recommended: customize(),
	typescript: customize({ typescript: true }),
	customize,
};

export default tsPlugin;

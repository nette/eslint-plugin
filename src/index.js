/**
 * @nette/eslint-plugin
 *
 * ESLint plugin with custom rules for Nette-specific linting
 */

import plugin from './plugins.js';
import jsConfig from './configs/javascript.js';
import baseConfig from './configs/base.js';
import browserConfig from './configs/browser.js';

/**
 * Configuration factory for creating custom ESLint configurations
 *
 * @param {Object} options Configuration options
 * @param {boolean} [options.browser=true] Whether to include browser globals
 * @returns {Array} ESLint configuration array
 */
function customize(options = {}) {
	return [
		...baseConfig,
		...((options.browser ?? true) ? browserConfig : []),
		...jsConfig,
	];
}

plugin.configs = {
	recommended: customize(),
	customize,
};

export default plugin;

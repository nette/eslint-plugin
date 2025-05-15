import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import noThisInArrow from './rules/no-this-in-arrow-except-nested.js';
import preferLineComments from './rules/prefer-line-comments.js';
import latteProcessor from './preprocessors/latte.js';

let __filename = fileURLToPath(import.meta.url);
let pkgPath = resolve(dirname(__filename), '../package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

export default {
	meta: {
		name: pkg.name,
		namespace: 'nette',
		version: pkg.version,
	},

	rules: {
		'no-this-in-arrow-except': noThisInArrow,
		'prefer-line-comments': preferLineComments,
	},

	processors: {
		latte: latteProcessor,
	},
};

const meta = {
	type: 'suggestion',
	docs: {
		description: 'Prefer // over /* */ for single-line comments (but allow one-line JSDoc /** … */).',
		recommended: true,
		url: 'https://github.com/nette/eslint-plugin#prefer-line-comments',
	},
	schema: [],
	fixable: 'code',
	messages: {
		preferLine: 'Prefer // instead of /* */ for single-line comments.',
	},
};

// comments whose meaning depends on the /* */ form: ESLint directives, coverage hints,
// tooling annotations (webpack/vite/rollup/terser magic comments, @license, #__PURE__, …)
// and preserved-license (/*! … */) blocks. Rewriting these to // would break them.
const ANNOTATED = /^(eslint\b|globals?\b|exported\b|istanbul\b|[cv]8\b|node:coverage\b|webpack[A-Z]|[@#!])/;

function create(context) {
	let sourceCode = context.sourceCode;

	return {
		Program() {
			for (let comment of sourceCode.getAllComments()) {
				if (comment.type !== 'Block') {
					continue;
				}

				let content = comment.value.trim();
				let isSingleLine = !comment.value.includes('\n');
				let isJSDoc = content.startsWith('*');

				if (!isSingleLine || isJSDoc || ANNOTATED.test(content)) {
					continue;
				}

				// a // comment would swallow anything that follows on the same line
				let nextToken = sourceCode.getTokenAfter(comment, { includeComments: true });
				if (nextToken && nextToken.loc.start.line === comment.loc.end.line) {
					continue;
				}

				context.report({
					loc: comment.loc,
					messageId: 'preferLine',
					fix(fixer) {
						return fixer.replaceTextRange(
							[comment.range[0], comment.range[1]],
							`// ${content}`,
						);
					},
				});
			}
		},
	};
}

export default { meta, create };

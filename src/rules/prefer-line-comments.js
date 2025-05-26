const meta = {
	type: 'suggestion',
	docs: {
		description: 'Prefer // over /* */ for single-line comments (but allow one-line JSDoc /** … */).',
		recommended: true,
	},
	schema: [],
	fixable: 'code',
	messages: {
		preferLine: 'Prefer // instead of /* */ for single-line comments.',
	},
};

function create(context) {
	let sourceCode = context.sourceCode;

	return {
		Program() {
			for (let comment of sourceCode.getAllComments()) {
				if (comment.type !== 'Block') {
					continue;
				}

				let text = comment.value;
				let isSingleLine = !text.includes('\n');
				let isJSDoc = text.trim().startsWith('*');

				// report only true single-line non-JSDoc blocks
				if (isSingleLine && !isJSDoc) {
					context.report({
						loc: comment.loc,
						messageId: 'preferLine',
						fix(fixer) {
							let content = text.trim();
							return fixer.replaceTextRange(
								[comment.range[0], comment.range[1]],
								`// ${content}`,
							);
						},
					});
				}
			}
		},
	};
}

export default { meta, create };

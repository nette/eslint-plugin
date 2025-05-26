const meta = {
	type: 'problem',
	docs: {
		description: 'Disallow `this` inside an arrow function, with fine-grained exceptions',
		recommended: true,
		url: null, // Add a URL to your docs if available
	},
	schema: [
		{
			type: 'object',
			properties: {
				allowNestedInFunction: {
					type: 'boolean',
					default: false,
					description: 'If true, allows `this` in an arrow when that arrow is enclosed by ANY regular function',
				},
			},
			additionalProperties: false,
		},
	],
	messages: {
		noThisInArrow: 'Do not use `this` inside an arrow function',
		noThisInArrowWithException: 'Do not use `this` inside an arrow function, unless it is a callback or a class method body',
	},
};

function create(context) {
	let [{ allowNestedInFunction = false } = {}] = context.options;
	let sourceCode = context.sourceCode;

	/** returns closest ancestor of given types, starting right above a given index */
	let findAbove = (ancestors, startIdx, matcher) => {
		for (let i = startIdx - 1; i >= 0; i--) {
			if (matcher(ancestors[i])) {
				return { node: ancestors[i], idx: i };
			}
		}
		return null;
	};

	return {
		'ArrowFunctionExpression ThisExpression'(node) {
			let ancestors = sourceCode.getAncestors(node); // Program → parent-of-this
			let len = ancestors.length;

			// ignore if *any* non-arrow function sits between `this` and the nearest arrow
			for (let i = len - 1; i >= 0; i--) {
				let a = ancestors[i];

				if (a.type === 'FunctionExpression' || a.type === 'FunctionDeclaration') {
					return; // `this` belongs to that regular function → valid
				}
				if (a.type === 'ArrowFunctionExpression') {
					break; // found the relevant arrow, no blocker above
				}
			}

			// we really are inside an arrow
			let arrowIdx = findAbove(ancestors, len, (n) => n.type === 'ArrowFunctionExpression')?.idx;
			if (arrowIdx == null) { // safety
				return;
			}

			// locate nearest regular function *above* the arrow
			let wrapper = findAbove(ancestors, arrowIdx, (n) =>
				n.type === 'FunctionExpression' || n.type === 'FunctionDeclaration',
			);

			if (allowNestedInFunction) {
				if (wrapper) { // any wrapper regular fn is enough
					return;
				}
				context.report({
					node,
					messageId: 'noThisInArrow',
				});
				return;
			}

			// default mode: wrapper must be a callback (parent CallExpression) or a class method body (parent MethodDefinition)
			if (wrapper) {
				let parentOfWrapper = ancestors[wrapper.idx - 1] ?? null;
				let ok = parentOfWrapper && (parentOfWrapper.type === 'CallExpression' || parentOfWrapper.type === 'MethodDefinition');
				if (ok) {
					return; // allowed
				}
			}

			context.report({
				node,
				messageId: 'noThisInArrowWithException',
			});
		},
	};
}

export default { meta, create };

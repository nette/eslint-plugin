const meta = {
	type: 'problem',
	docs: {
		description: 'Disallow `this` inside an arrow function, with fine-grained exceptions',
		recommended: true,
		url: 'https://github.com/nette/eslint-plugin#no-this-in-arrow-except',
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

	/** whether the node gives `this` its own binding, as an arrow does not */
	let bindsThis = (n) => n.type === 'FunctionExpression'
		|| n.type === 'FunctionDeclaration'
		|| n.type === 'PropertyDefinition'
		|| n.type === 'StaticBlock';

	return {
		'ArrowFunctionExpression ThisExpression'(node) {
			let ancestors = sourceCode.getAncestors(node); // Program → parent-of-this
			let len = ancestors.length;

			// ignore if anything binding `this` sits between `this` and the nearest arrow
			for (let i = len - 1; i >= 0; i--) {
				let a = ancestors[i];

				if (bindsThis(a)) {
					return; // `this` belongs to that node → valid
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

			// locate the nearest node above the arrow that binds `this`
			let wrapper = findAbove(ancestors, arrowIdx, bindsThis);

			// inside a class field initializer or static block, `this` binds to the
			// instance/class, so the arrow inherits a meaningful `this`
			if (wrapper?.node.type === 'PropertyDefinition' || wrapper?.node.type === 'StaticBlock') {
				return;
			}

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

			// default mode: the wrapping regular function must itself supply a useful `this`
			// - a callback (parent CallExpression),
			// - a class method (parent MethodDefinition),
			// - an object/class member function (parent Property / PropertyDefinition)
			if (wrapper) {
				let parentOfWrapper = ancestors[wrapper.idx - 1] ?? null;
				let allowedParents = ['CallExpression', 'MethodDefinition', 'Property', 'PropertyDefinition'];
				if (parentOfWrapper && allowedParents.includes(parentOfWrapper.type)) {
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

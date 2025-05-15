let defaultSettings = {
	replacementFunction: null,
	removeLatteErrors: false,
};
let settings = defaultSettings;
let context;

// Regex for Latte tags: {foo}, {/foo}, {=expr}, {_expr}, {$var} - supports multi-line
const LATTE_TAG_MULTILINE = /\{(?:[a-zA-Z_$\\/=][^}]*)\}/gs;

// Default internal replacement function
function defaultReplacement(tagContent) {
	let replacedTag = /^(?:=|_|\$|(?:control|link|plink|asset)(?!\w)|\w[\w:\\]*(\(|::))/;

	if (tagContent === 'l') {
		return '{';
	}
	if (tagContent === 'r') {
		return '}';
	}
	if (replacedTag.test(tagContent)) {
		// so that you can call a method over it and eslint doesn't correct it as quotes
		return '[]';
	}

	return ''; // remove completely
}

function getLineStartIndices(text) {
	return text.split('\n').map((s) => s.length).reduce((prev, current) => {
		prev.push(prev[prev.length - 1] + current + 1);
		return prev;
	}, [0]);
}

function getLocation(position, lineStartIndices) {
	let i;
	for (i = 1; i < lineStartIndices.length; i++) {
		if (position >= lineStartIndices[i - 1] && position < lineStartIndices[i]) {
			break;
		}
	}
	return {
		line: i,
		column: position - lineStartIndices[i - 1] + 1,
	};
}

function getPosition(loc, lineStartIndices) {
	return lineStartIndices[loc.line - 1] + loc.column - 1;
}

function getOriginalPosition(processedPosition, forEndOfRange = false) {
	let currentProcessedPos = 0;
	let currentOriginalPos = 0;

	// Sort filtered parts by start position
	let sortedFiltered = [...context.filtered].sort((a, b) => a.start.position - b.start.position);

	for (let f of sortedFiltered) {
		// Copy characters before this tag
		let charsBeforeTag = f.start.position - currentOriginalPos;

		// If processed position is before this tag, return with simple offset
		if (processedPosition < currentProcessedPos + charsBeforeTag) {
			return currentOriginalPos + (processedPosition - currentProcessedPos);
		}

		// Move past the chars before the tag
		currentProcessedPos += charsBeforeTag;
		currentOriginalPos = f.start.position;

		// If processed position is within this tag's replacement
		if (processedPosition < currentProcessedPos + f.replacement.length) {
			// For end of range, map to end of original tag
			if (forEndOfRange) {
				return f.end.position;
			}
			// For start of range, map to start of original tag
			return f.start.position;
		}

		// Move past this tag's replacement
		currentProcessedPos += f.replacement.length;
		currentOriginalPos = f.end.position;
	}

	// Position is after all tags
	return currentOriginalPos + (processedPosition - currentProcessedPos);
}

function getOriginalLocation(loc) {
	let processedPosition = getPosition(loc, context.code.lineStartIndices);
	let originalPosition = getOriginalPosition(processedPosition);
	return getLocation(originalPosition, context.originalLineStartIndices);
}

function isInLatteCode(position) {
	for (let i = 0; i < context.filtered.length; i++) {
		let f = context.filtered[i];
		if (position >= f.start.position && position < f.end.position) {
			return true;
		}
	}
	return false;
}

function findSyntaxOffRegions(text) {
	let regions = [];
	let match;

	// Check if element has n:syntax="off" attribute
	let pattern = /<script\b([^>]*\bn:syntax\s*=\s*(?:(['"]?)off\2)[^>]*)>/gi;

	while ((match = pattern.exec(text)) !== null) {
		let startPos = match.index;

		// Find the closing tag
		let closingTagRegex = new RegExp(`</script\\s*>`, 'gi');
		closingTagRegex.lastIndex = pattern.lastIndex;

		let closingMatch = closingTagRegex.exec(text);
		if (closingMatch) {
			regions.push({
				start: startPos,
				end: closingTagRegex.lastIndex,
			});
		}
	}

	return regions;
}

function isInSyntaxOffRegion(position, syntaxOffRegions) {
	return syntaxOffRegions.some((region) =>
		position >= region.start && position < region.end,
	);
}

function remapMessages(messages) {
	let ms = [];
	let startPosition = context.filtered.length > 0 ? context.filtered[0].start.position : 0;
	let start = false;

	for (let i = 0; i < messages[0].length; i++) {
		let originalMessage = messages[0][i];

		if (!start) {
			let position = getPosition(originalMessage, context.code.lineStartIndices);
			if (position >= startPosition) {
				start = true;
			}
		}

		if (start) {
			if (settings.removeLatteErrors) {
				let position = getPosition(originalMessage, context.code.lineStartIndices);
				let pos = getOriginalPosition(position);
				if (isInLatteCode(pos)) {
					continue;
				}
				if (originalMessage.fix && originalMessage.fix.range) {
					pos = getOriginalPosition(originalMessage.fix.range[0]);
					if (isInLatteCode(pos)) {
						continue;
					}
				}
			}

			// Create a copy of the message to avoid modifying the original
			let message = { ...originalMessage };

			let loc = getOriginalLocation(message);
			message.line = loc.line;
			message.column = loc.column;

			// Map fix range
			if (message.fix && message.fix.range) {
				message.fix = { ...message.fix }; // Copy fix object
				message.fix.range = [
					getOriginalPosition(message.fix.range[0]),
					getOriginalPosition(message.fix.range[1]),
				];
			}

			// Map end location
			if (message.endLine && message.endColumn) {
				loc = getOriginalLocation({
					line: message.endLine,
					column: message.endColumn,
				});
				message.endLine = loc.line;
				message.endColumn = loc.column;
			}

			ms.push(message);
		} else {
			ms.push(originalMessage);
		}
	}

	// Always update with mapped messages
	messages[0] = ms;
}

const latteProcessor = {
	preprocess: (text, filename) => {
		context = null;

		if (!filename.endsWith('.latte')) {
			return [text];
		}

		let found = false;
		let filteredParts = [];
		let filteredText = '';
		let originalLineStartIndices;
		let regex = LATTE_TAG_MULTILINE;

		// Find regions with n:syntax="off"
		let syntaxOffRegions = findSyntaxOffRegions(text);

		// Reset regex
		regex.lastIndex = 0;

		let lastIndex = 0;
		let match;

		while ((match = regex.exec(text)) !== null) {
			// Skip if this tag is in a syntax="off" region
			if (isInSyntaxOffRegion(match.index, syntaxOffRegions)) {
				continue;
			}

			if (!found) {
				found = true;
				originalLineStartIndices = getLineStartIndices(text);
			}

			// Determine replacement based on tag type
			let tagContent = match[0].slice(1, -1); // Remove { and }
			let replacement = (settings.replacementFunction ? settings.replacementFunction(tagContent) : null)
				?? defaultReplacement(tagContent);

			// Handle leading whitespace removal for empty replacement on standalone tags
			let actualReplacement = replacement;
			let actualStartIndex = match.index;

			if (replacement === '') {
				// Check if the tag is on a line with only whitespace
				let lineStart = text.lastIndexOf('\n', match.index) + 1;
				let lineEnd = text.indexOf('\n', regex.lastIndex);
				let actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
				let beforeTag = text.substring(lineStart, match.index);
				let afterTag = text.substring(regex.lastIndex, actualLineEnd);

				// If line contains only whitespace + tag + whitespace, remove leading whitespace
				if (beforeTag.trim() === '' && afterTag.trim() === '') {
					// Remove leading whitespace by changing start position
					actualStartIndex = lineStart;
				}
			}

			let startLoc = getLocation(actualStartIndex, originalLineStartIndices);
			startLoc.position = actualStartIndex;
			let endLoc = getLocation(regex.lastIndex, originalLineStartIndices);
			endLoc.position = regex.lastIndex;

			filteredParts.push({
				start: startLoc,
				end: endLoc,
				replacement: actualReplacement,
			});

			// Add text before the match + replacement
			filteredText += text.substring(lastIndex, actualStartIndex) + actualReplacement;
			lastIndex = regex.lastIndex;
		}

		// Add remaining text
		filteredText += text.substring(lastIndex);

		context = {
			source: text,
			filtered: filteredParts,
			code: { lineStartIndices: getLineStartIndices(filteredText) },
			originalLineStartIndices: originalLineStartIndices || getLineStartIndices(text),
		};

		return [filteredText];
	},

	postprocess: (messages) => {
		if (context?.filtered?.length > 0) {
			remapMessages(messages);
		}
		return [].concat(...messages);
	},

	supportsAutofix: true,
};

latteProcessor.configure = function (custom) {
	settings = { ...defaultSettings, ...custom };
};

export default latteProcessor;

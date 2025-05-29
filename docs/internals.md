# ESLint-Plugin internals

The `@nette/eslint-plugin` bundles shareable configs, two custom rules, and — the
only non-obvious part — a **Latte preprocessor** that lets ESLint lint the JavaScript
inside `.latte` templates. One file.

## The Latte preprocessor: strip tags, lint, then remap positions back

ESLint cannot parse Latte, so `preprocessors/latte.js` runs a two-way transform:
`preprocess` rewrites the `.latte` source into valid-ish JS that ESLint lints, and
`postprocess` **maps the reported positions back to the original source**.

`preprocess`:

- Finds every Latte tag — single-brace `{…}`, double-brace `{{…}}`, and comments
  `{* … *}` / `{{* … *}}` — with four regexes, then **sorts all matches by position**
  and processes them in one pass, skipping a match nested inside an already-consumed
  region (a tag inside a comment).
- **`n:syntax="off"`/`"double"` regions** are respected: a `<script n:syntax=off>` block
  is left untouched, and inside a `double` region only `{{…}}` tags are processed while
  outside only `{…}` are — so the wrong brace style is never mis-stripped.
- Replacement is chosen so ESLint neither errors nor "fixes" the placeholder into
  something wrong: a value-ish tag (`{=…}`, `{$…}`, `{control …}`, `{link …}`, a
  method/`::` call) becomes a **`[N]` array-index placeholder** (so `foo|filter`-style
  usage still parses and ESLint won't quote it), `{l}`/`{r}` become `{`/`}`, comments
  and other tags become `''`. A stripped standalone tag on an otherwise-blank line also
  has its **leading whitespace removed** so no empty indented line remains.
- It records a `filtered` list of `{start, end, replacement}` and keeps **per-file
  contexts in a `Map` keyed by filename** — because ESLint may interleave files, a
  single shared `context` would be clobbered.

`postprocess` (`remapMessages`) is the inverse: `getOriginalPosition` walks the sorted
`filtered` list, accumulating original-vs-processed offsets, to translate each message
line/column — **and its `fix.range` and end position** — back to the original file
(a fix-range end maps to the *end* of the original tag). `removeLatteErrors` optionally
drops any message whose position (or fix range) falls **inside** a Latte tag, since those
aren't real JS issues. `supportsAutofix` is true, so the remapped fix ranges must be
exact or autofix corrupts the template — that position math is the load-bearing part.

## The rest

The custom rules (`no-this-in-arrow-except`, `prefer-line-comments`) and the config
layering (`base` → `javascript`/`browser`/`jsx`/`typescript`) are standard ESLint
authoring and readable from their sources; only the preprocessor's tag-stripping and
position-remapping are expensive to reconstruct.

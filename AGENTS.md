# To My Agents!

It is my fervent wish that this file guide every AI coding agent working with code in this repository.

## Documentation

Any distilled, agent-facing documentation for this package - how it works
internally and the rationale behind key design decisions - lives in `docs/`.
Consult it before non-trivial changes; it is the source of truth from which the
public manual is distilled.

Most of it (the shareable configs, the two custom rules) is standard ESLint
authoring, readable from the sources. The one non-obvious part is the **Latte
preprocessor** - read `docs/internals.md` before touching it.

## Project Overview

`@nette/eslint-plugin` is an ESLint config package (flat config) with Nette-specific
custom rules for JavaScript/TypeScript, plus a **processor that lets ESLint lint the
JavaScript inside `.latte` templates**.

- **Package**: `@nette/eslint-plugin` (Node; ESLint v9.26+ / v10, flat config only)

## Essential Commands

```bash
npm run test                                   # Mocha (ESLint RuleTester)
npx mocha tests/prefer-line-comments.test.js   # a single test file
npm run lint                                    # and lint:fix
```

## Conventions

- Supports ESLint v9.26+ and v10; v10 needs Node `^20.19.0 || ^22.13.0 || >=24` and
  `@stylistic/eslint-plugin` ^5 (v4 breaks on ESLint 10). `@eslint/js` and
  `typescript-eslint` are **direct dependencies**.
- Tests use ESLint's `RuleTester` (one file per rule) + integration/config tests.
  **Reset the Latte processor config in `beforeEach()`** - it holds global state, so
  tests interfere otherwise; TypeScript rules can also skew assertions.

## Working in this repo

- **The Latte preprocessor is the only trap.** `preprocess` rewrites `.latte` into
  JS-parseable text and `postprocess` maps reported positions back:
  - Value-ish tags (`{=…}`, `{$…}`, `{control …}`, calls) become a **`[N]`
    array-index placeholder** so ESLint parses them and never "fixes" the placeholder
    into something wrong; `{l}`/`{r}` → `{`/`}`; comments/other tags → `''`. A
    stripped standalone tag also loses its leading whitespace.
  - **`n:syntax="off"`/`"double"` regions are respected** (a `double` region processes
    only `{{…}}`), and **per-file contexts are kept in a `Map` keyed by filename** -
    ESLint interleaves files, so one shared context would be clobbered.
  - **`postprocess` remaps each message's position AND its `fix.range`/end** back to
    the original. `supportsAutofix` is true, so **that position math must be exact or
    autofix corrupts the template** - the load-bearing part. `removeLatteErrors` drops
    messages that fall inside a Latte tag.
- **`typescript-eslint` is a direct dependency**, so the `/typescript` entry point
  resolves out of the box; only the `typescript` compiler is left to the consumer.
  Import it via `import nette from '@nette/eslint-plugin/typescript'`
  (`customize({typescript: true})` is no longer supported).
- **Rule name vs file mismatch:** the rule is `no-this-in-arrow-except` but its file is
  `no-this-in-arrow-except-nested.js`.
- **Releasing:** npm publishes `package.json`'s `version` and ignores git tags, so
  always bump with `npm version <x>` (updates package.json + commits + tags together),
  never a bare `git tag`.
- User-facing how-to (the rule options, `configs.latte`/`configureLatte()` options,
  JSX/TypeScript setup) is manual material and lives in the README.

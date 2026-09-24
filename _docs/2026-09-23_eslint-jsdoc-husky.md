# ESLint JSDoc check via husky + lint-staged

## Background and motivation

The pre-commit hook (husky -> `bun lint-staged`) was expected to enforce JSDoc on
TypeScript files, but nothing was being checked.

Root causes:

1. `eslint.config.js` had no `files` pattern, so the flat config only applied to
   `.js/.mjs/.cjs`. `.ts` files were reported as "File ignored because no matching
   configuration was supplied".
2. No TypeScript parser was configured, so ESLint could not parse `.ts` syntax.
3. The lint-staged glob `"*.{ts}"` uses a single-item brace, which is not expanded,
   so it never matched any staged file.

## Implementation details and approach

- Add `typescript-eslint` (dev dependency) and use its parser.
- Add `files: ["**/*.ts"]` to the ESLint config.
- Change the lint-staged glob to `"*.ts"`.

## Related files

- `eslint.config.js`
- `package.json`

## Status (in progress)

- Done: `files: ["**/*.ts"]` + `tseslint.parser` in `eslint.config.js`; lint-staged glob fixed to `"*.ts"`;
  `typescript-eslint@8.70.1` added as a dev dependency.
- Blocker: typescript-eslint throws "does not support TS 7.0" because the project uses `typescript@^7`.
- Planned fix (pending user approval): per the TS 7.0 release notes, alias TS 6 API for tools:
  `"typescript": "npm:@typescript/typescript6@^6.0.2"` and `"@typescript/native": "npm:typescript@^7.0.2"`.
- Side effect until resolved: ESLint crashes on load, so the pre-commit hook will fail.

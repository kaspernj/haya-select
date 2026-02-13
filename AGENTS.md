# Agent Instructions

- Propose commit messages and PR titles/descriptions yourself unless explicitly provided.
- If the example app server is not running locally, use `npm run test:dist` (which runs `npm run build:example:dist`) to build the example web `dist/` and run system tests.
- System tests require `SYSTEM_TEST_HOST` set to `dist` or `expo-dev-server`; prefer `npm run test:dist` unless the Expo dev server is already running.
- Avoid ending JavaScript lines with semicolons unless required for correctness.
- Use spaces inside named import/export braces (for example: `{foo, bar}`).
- For scoundrel evals that return data, use an explicit `return` statement inside the eval.
- Suggest relevant git branch names for the work when asked to create a PR or branch.
- In this repo, do not use `.browser-spec.js` suffix; keep specs named with the standard `*-spec.js` pattern.

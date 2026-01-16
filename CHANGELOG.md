# Changelog

## Unreleased
- Fix crash when opening the select before layout measurements are available.
- Update options width when layout data arrives after opening.
- Guard options positioning until layout data is available.
- Scope Prettier linting overrides to match existing config/select file styles.
- Disable ESLint rules that fail against existing config/select code style.
- Disable Prettier's semicolon enforcement in ESLint.
- Run linting in the peak_flow script.
- Increase system test teardown timeout to reduce CI flakiness.
- Bump `system-testing` to 1.0.60.
- Add ESLint JSDoc checks for type safety.
- Add JSDoc prop typings for HayaSelect.
- Expand HayaSelect options prop typing and shape validation.
- Switch `useEventListener` import to `ya-use-event-listener`.
- Bump `system-testing` to 1.0.62.
- Add paginated async options support and pagination controls in HayaSelect.
- Add system specs for pagination controls.
- Reset pagination page state on close to avoid stale page size inference.
- Stabilize pagination system specs for manual entry and navigation.
- Use scoundrel clicks in pagination specs to reduce selector flakiness.

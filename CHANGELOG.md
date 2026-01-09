# Changelog

## Unreleased
- Fix crash when opening the select before layout measurements are available.
- Update options width when layout data arrives after opening.
- Guard options positioning until layout data is available.
- Scope Prettier linting overrides to match existing config/select file styles.
- Disable ESLint rules that fail against existing config/select code style.
- Disable Prettier's semicolon enforcement in ESLint.
- Run linting in the peak_flow script.

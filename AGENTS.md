# Haya Select Agent Guide

Haya Select is a published React Native + Web select component. The library uses JavaScript/JSX with JSDoc and PropTypes; the separate Expo example app uses TypeScript. Keep this file focused on repository-specific guidance, not a copy of global agent workflow rules.

## Repository Map

| Path | Responsibility |
| --- | --- |
| `src/select/index.jsx` | Main ShapeComponent: selection, async loading, search, pagination, positioning, portals, and mobile sheet. |
| `src/select/option.jsx`, `option-group.jsx`, `pagination-page-button.jsx` | Memoized child components for options, group labels, and pagination. |
| `src/config.js` | Consumer configuration singleton, including the translation hook. |
| `src/system-test-helpers.js` | Published Selenium helpers, used by this repository and downstream consumers. |
| `src/config/configuration.node.js` | Velocious test configuration and SQLite setup, not frontend configuration. |
| `example/App.tsx` | Example providers, translator stub, screen selection, and browser test client bootstrap. |
| `example/screens/` | Small behavior-specific fixtures; `index.tsx` registers screens and `shared.tsx` holds shared fixtures. |
| `example/metro.config.js` | Local library resolution and shared React/React Native/portal dependency resolution. |
| `spec/system/` | Velocious/Selenium behavior specs, lifecycle, and pagination helpers. |
| `scripts/velocious-test.js` | Custom test discovery, filtering, dist build, and runner entrypoint. |
| `android/`, `ios/`, `expo-module.config.json` | Expo native-module scaffold, separate from the JavaScript select implementation. |
| `peak_flow.yml` | CI installation, static checks, exported-web system tests, and Expo Doctor. |
| `README.md`, `CHANGELOG.md`, `changelog.d/` | Public usage documentation, existing changelog, and per-change release-note fragments. |

## Source And Packaging

- Edit `src/`, not generated output. `npm run build` produces library JavaScript and declarations in `build/`; `npm run build:example:dist` builds the library and exports the example web app to root `dist/`, not `example/dist/`.
- `build/` and `dist/` are ignored and generated-only. Never hand-edit or commit them, including generated `.d.ts` and declaration-map files.
- `db/` and `tmp/screenshots/` are ignored local test artifacts, not application source.
- Root and `example/` are separate npm packages with separate `package-lock.json` files. `spec/package.json` and `src/config/package.json` provide ESM boundaries, not additional install targets.
- The example links the library with `"haya-select": "file:.."`, and select fixtures import `src/select/index.jsx` directly. Passing example tests does not verify npm package entrypoints.
- For public API or packaging changes, check source exports, `package.json` entrypoints and `files`, generated declarations, documented imports, and example resolution together. Verify actual built files rather than assuming an entrypoint exists because a manifest or README names it.
- Keep browser-test helpers in their dedicated entrypoint, `haya-select/build/system-test-helpers.js`; do not pull Selenium dependencies into the UI component import path.
- Declare production imports in the owning package's dependencies or peer dependencies. Do not rely on packages being available only through the example or transitive dependencies.
- For shared dependency updates, inspect both manifests, keep corresponding declarations aligned, and regenerate the affected lockfiles with npm. Preserve appropriate peer ranges rather than copying a development pin into the peer contract.
- Leave native scaffold and example native projects alone for ordinary select changes. Native-module changes require checking both platforms and the Expo module registration together.

## Component Conventions

- Follow the existing `ShapeComponent` / `shapeComponent` / `memo` structure in `src/select/`; do not rewrite it into another component pattern as incidental cleanup.
- Maintain JSDoc prop/state/callback typedefs, runtime PropTypes, and defaults together. Fix type contracts in source, never generated declarations.
- Use `this.p` for proxied props and `this.s` for state. Declare state keys in the typed state shape and use `this.s.key = value` for ordinary top-level changes; reserve `this.setState(...)` for functional updaters or completion callbacks.
- Pass and call component methods through `this.tt.methodName` when possible so missing methods fail loudly. Do not switch to direct `this.methodName` calls just to fix binding; follow existing `this.tt` ref usage too.
- Register shared hooks, event listeners, and effects using the existing `setup()` pattern. Keep animation, layout, and scroll cleanup in the relevant lifecycle paths.
- Controlledness of `values` and `toggled` depends on prop-key presence, not truthiness. Empty controlled arrays/objects are meaningful; do not accidentally fall back to internal/default state.
- Existing option matching deliberately uses loose equality to match numeric IDs and their string representations. Do not mechanically replace those comparisons with strict equality.
- Async option callbacks receive search/page context and optional `values` when loading default selections. They can return an array or `{options, totalCount, page, pageSize}`. Preserve request-generation checks so stale responses cannot overwrite newer results.

## Styling And Platforms

- Shared UI uses React Native primitives and style objects. Guard browser globals and preserve native measurement paths; desktop DOM positioning is not a replacement for `measureInWindow()`.
- Route public style hooks through `stylingFor`. Entries can be objects or callbacks receiving `{opened, optionsPlacement, state, style}`; do not mutate the caller's styles or the base style passed into a callback.
- Preserve stable style/dataset identities using existing caches. Include every relevant dependency when caching callback styles or passing styling context into memoized children; check `option-group.jsx` and its `stylingContextKey` wiring before changing that path.
- Layout changes can affect both desktop dropdown placement (`above` / `below`) and mobile sheet placement (`sheet`). Automatic sheet mode uses window width at or below 768px on web and native; `mobileOptionsMode` can force `always` or `never`.
- Keep sheet options scrollable without scrolling pagination/search away. Preserve body-scroll restoration on close/unmount and the iOS sheet search sizing that avoids browser zoom.
- Options render through a portal by default. Preserve the example's `PortalProvider`, `PortalHost`, and `OutsideEyeProvider` hierarchy; portal options are not necessarily descendants of the select wrapper.
- Built-in copy goes through the component's `translate()` method, with relative keys under `haya_select` and appropriate fallback text. Keep the `setUseTranslate` stub in `example/App.tsx` so fallback translator warnings do not pollute browser logs.

## Install And Checks

Commands below run from the repository root unless noted. Use the checked-in npm lockfiles and CI's npm workflow despite the root manifest's Yarn `packageManager` field.

| Command | Purpose |
| --- | --- |
| `npm install` | Install root dependencies; the `prepare` lifecycle also builds the library. |
| `npm --prefix example install` | Install the example's separate dependency tree. |
| `npm run lint` | Required aggregate static gate: ESLint followed by TypeScript. |
| `npm run eslint` / `npm run typecheck` | Individual checks for diagnosis, not substitutes for the final lint gate. |
| `npm run build` | Generate the library's `build/` output with Expo module tooling. |
| `npm run build:example:dist` | Build the library and export the example web app to `dist/`. |
| `npx expo-doctor` | Expo health check used by CI; run for Expo/dependency changes. |

- Root `tsconfig.json` includes `src/`; root typechecking does not also validate the example's strict TypeScript project.
- If Expo Doctor reports SDK support-package mismatches caused by unexpected nested newer Expo packages, run `npm dedupe` in the affected package and rerun Doctor before bumping SDK/dependencies. Inspect resulting lockfile changes.
- Keep `.github/dependabot.yml` update configs unique per `package-ecosystem` + `directory` + `target-branch`; do not duplicate the npm entry for `/example`.

## System Tests

- Specs use Velocious and Selenium, not Jest. Use standard `*-spec.js` filenames, never `.browser-spec.js`.
- `haya-select-render-spec.js` covers selection/rendering/layout/helpers; `haya-select-pagination-spec.js` covers page navigation and pagination scroll placement.
- Tests require `SYSTEM_TEST_HOST=dist` or `SYSTEM_TEST_HOST=expo-dev-server` and a working Chrome/ChromeDriver setup. Choose the smallest directly relevant tests; leave full-suite runs to CI.
- Reuse an already-running Expo server when available. Otherwise this repository's default is dist-backed testing; the custom runner builds the dist automatically.

Example selecting only the pagination spec file:

```sh
SYSTEM_TEST_HOST=dist npm test -- -- spec/system/haya-select-pagination-spec.js
```

The two `--` arguments are intentional with the current wrapper: npm consumes the first, and the test-file finder discards the first argument passed by the wrapper. Without the extra separator, a lone spec path is dropped and the whole suite can run. This command selects a file, not one example; the wrapper currently does not forward `:line` filters to `TestRunner`. Verify effective filtering before a narrow run rather than assuming a generic Velocious CLI flag works here.

To reuse an unchanged, already-built dist:

```sh
SYSTEM_TEST_HOST=dist SKIP_TEST_DIST_BUILD=true npm test -- -- spec/system/haya-select-pagination-spec.js
```

Do not skip the build after changes to library/example code or dependencies. `npm run test:dist` is an unfiltered convenience script, not a focused-test command; it explicitly builds and then invokes the runner, which also builds in dist mode.

For Expo dev-server mode, start a server only if needed in a separate terminal:

```sh
npm --prefix example start -- --port 3711
```

Then run the relevant spec against it:

```sh
SYSTEM_TEST_HOST=expo-dev-server npm test -- -- spec/system/haya-select-pagination-spec.js
```

Do not use the example's `web` script or pass `--web`; those open a browser automatically. Keep a healthy dev server running across source-only iterations.

- Default ports in `spec/system/system-test-lifecycle.js` are 3711 for the Expo app, 3712 for the test HTTP/dist server, 3713 for browser-client WebSocket commands, and 3714 for Scoundrel. Check for collisions before starting parallel sessions; existing host/port overrides are defined in that file.
- Browser tests verify the web renderer, including mobile-sized layouts, not native iOS/Android execution. Record native validation gaps when changing platform-specific behavior.

## Fixtures And Helpers

- Add a focused `example/screens/<behavior>-screen.tsx` fixture for new UI behavior and register its kebab-case name in `example/screens/index.tsx`. Prefer extending an existing matching fixture over duplicating one.
- The example selects fixtures with `?screen=<name>`; the browser test bridge is enabled only with `?systemTest=true`. Preserve the `systemTestingComponent` base selector and `blankText` readiness element in `example/App.tsx`.
- Use `setupSystemTestLifecycle()` and `runSystemTest(callback, {screen})` from `spec/system/system-test-lifecycle.js`. They own browser startup, initial fixture navigation, readiness, serialization, and teardown. Do not create independent start/stop cycles or concurrent commands on the shared session.
- Use `src/system-test-helpers.js` for reusable select interactions. Its default helper class and named open/close/pick/expect functions are also consumer APIs, not private spec utilities.
- Keep component test IDs under `haya-select/...`, use unique fixture wrapper IDs, and scope portal queries by the component's `data-id`. Do not assume options live beneath the fixture wrapper or select the first global dropdown when multiple selects exist.
- Assert visible behavior, selected values, option contents, or layout changes. For pagination, verify the option list changes as well as the page label.
- Use structured SystemTest/WebDriver interaction APIs and condition-based waits. Do not copy older script-click workarounds or add sleeps/retries to hide lifecycle failures. Scoundrel evals that return diagnostic data need an explicit `return` statement.
- Do not wrap `runSystemTest` calls in a custom `timeout(..., {timeout: 15000+})` safety net. Each interaction already carries its own specific timeout, so an outer blanket timer is a redundant double timeout that hides which step actually hung. Let the failing interaction's own timeout surface the real cause; only add an outer bound for a documented, inherently long operation.
- Restore viewport or other shared browser state in `finally`. Inspect browser errors and `tmp/screenshots/` artifacts before changing selectors or timing.

## Formatting

- Follow nearby maintained JS/JSX/TSX: double quotes, no trailing commas, and no JavaScript semicolons unless required for correctness or by a file-specific rule.
- Named imports/exports use no padding immediately inside braces and a space after commas: `{foo, bar}`, not `{ foo, bar }`.
- Respect `.eslintrc.js` overrides. `src/config/configuration.node.js` explicitly uses semicolons; do not reformat untouched Expo/template files or expand lint suppressions as incidental cleanup.
- Use descriptive kebab-case source/helper/fixture filenames, PascalCase component names, and camelCase props/methods.

## Documentation And Releases

- Public props, callback payloads, helper APIs, style hooks, and platform behavior changes should update relevant README usage documentation alongside source contracts and focused example/spec coverage.
- Add a concise release-note fragment under `changelog.d/<descriptive-kebab-case>.md` for user-visible changes, following the existing `- ...` bullet format. Do not invent a fragment aggregation or changelog versioning process; the current release script does not define one.
- `npm run release:patch` delegates to `release-patch` and performs release operations, not just a build. Do not run it, publish packages, or bump versions as part of routine validation; releases require an explicit request.
- Keep project agent guidance here. If assistant-specific instruction filenames are later needed, make them symlinks to `AGENTS.md`, not duplicate guides.

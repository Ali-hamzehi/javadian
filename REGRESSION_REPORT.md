# Regression verification

Final acceptance: **UI/UX Responsive Refinement — PARTIAL**.
Product: **Installable Prototype PWA — No Production Backend**.

## Executed commands

| Command | Result | Evidence |
|---|---|---|
| Baseline lint (`tsc --noEmit`) | PASS | Executed before source edits |
| Baseline production build | PASS, existing large-chunk warning | Vite 6.4.3; JS ~1.64 MB |
| Final `bun run typecheck` | PASS | docs/TYPECHECK_OUTPUT.txt |
| Final `bun run lint` | PASS | docs/LINT_OUTPUT.txt |
| Final `bun run test` | PASS — 15 tests | docs/TEST_OUTPUT.txt |
| Final `bun run build` | PASS, large-chunk warning retained | docs/BUILD_OUTPUT.txt |

The original project had no test command or separate lint engine. Existing lint is TypeScript checking; it is not an ESLint pass. Added tests use the existing tsx dependency and Node test runner. No dependency or framework upgrade was introduced, and bun.lock remains byte-identical. Bun 1.4.2 was obtained through an npm launcher because Bun was absent from PATH; dependency installation used `bun install --frozen-lockfile`.

## Business and boundary checks

| Check | Result | Actual method / limits |
|---|---|---|
| Accepted mock records, identifiers, prices, role predicates, authorization utilities | PASS — source preservation | SHA-256 comparison of 31 protected files against original ZIP; docs/PROTECTED_SOURCE_SHA256.json |
| Existing event handlers outside shell | PASS — source comparison | 110 handlers unchanged; only two legacy Escape handlers replaced by native dialog handling; docs/HANDLER_COMPARISON.json |
| Below-minimum price condition | PASS — executable store test | 24 pieces × 1,100,000 = 26,400,000 rials; reference 1,250,000 and minimum 1,180,000 retained; state needs_price_approval |
| Independent commercial approval | PASS — executable store test | Creator self-approval rejected; unauthorized ordinary persona rejected; independent commercial approver accepted |
| Approval inbox linkage | PASS — executable store test | New order links to pending_approval WorkItem |
| SupplyRequest → WorkItem | PASS — executable store test | Both IDs/source code resolve; 3 cartons × 12 = 36 base units; estimate 3,000 rials |
| Supply draft behavior | PASS — executable store test | Draft has no WorkItem/current assignee |
| Inbox and role rendering | PASS — server-rendered markup | All 12 supplied personas render; this is not click-through UI verification |
| Catalog, sales and supply initial screens | PASS — server-rendered markup | Initial views render without an exception; wizard steps not exercised in browser |
| Warehouse receipt deferred boundary | PASS — source + markup | DEFERRED, NOT_CONNECTED and PROTOTYPE_ONLY remain visible in rendered initial screen; no receipt business logic changed |
| Operational-finance boundary | PASS — source + markup | «ثبت نشده در سیستم مالی» retained; no bank/backend/Parsina integration introduced |
| Warehouse Exit lifecycle | PASS — protected source | Types/store unchanged; no invented COMPLETED state added. Dispatch UI not exercised in browser |
| SW business-cache exclusions | PASS — executable isolated worker test | API/warehouse/payment/customer requests, query parameters, Authorization, cross-origin and POST bypass caching; allowlisted static script can cache |
| SW update consent / background sync | PASS — isolated worker test + unchanged source | skipWaiting only on explicit message; no sync handler. Real installed-app update not tested |
| AI-themed icons | PASS — source inventory | Five rendered Sparkles occurrences replaced, six unused imports removed; no listed AI icon in runtime source |
| Small typography source | PASS — source inspection | Arbitrary 8/9/10/11px text classes removed; map SVG labels raised to 14px |
| Form labels/error associations | PASS — component markup tests | Reusable native/React inputs and per-instance legacy field wrappers checked; not a screen-reader audit |
| Native dialog semantics | PASS — component markup test | Native dialog element and accessible name; live focus/Back/stack behavior unverified |
| Loading button and switch semantics | PASS — markup tests | Loading retains label/busy/disabled state; switch is a native button with checked state |
| Adaptive table content | PASS — markup test | All source cells preserved with header-derived mobile labels, including colspan row |
| No remote persona-image dependency | PASS — markup test | Monogram display does not request source avatar URLs; source persona records unchanged |
| No application-origin console error | NOT TESTED | Browser could not open preview |
| No dead navigation / no mobile overflow / zoom | NOT TESTED | Markup/source checks cannot establish these |
| Install, offline, update banner and iOS guide interaction | NOT TESTED | PWA source preserved; browser/device execution blocked |

## Limitations and risks

- Full browser QA, seven screenshots, keyboard/focus behavior, responsive layout, contrast across every composed surface and 200% zoom remain missing. No WCAG conformance claim is made.
- The existing monolithic bundle remains ~1.65 MB uncompressed (~356 KB gzip). No architectural code-splitting was introduced in this visual pass.
- Bespoke badges and field/group patterns outside the shared primitives retain some legacy presentation. Shared semantic tokens are implemented, but complete screen-by-screen consistency still needs visual acceptance.
- The original PWA emblem (including its supplied styling) is retained to avoid inventing a replacement brand.
- Existing mock behavior has not been promoted to production behavior. Tests may create in-memory demo records in their own process; source datasets are not rewritten.
- Protected source equivalence and method tests do not certify all UI workflows. The final state remains PARTIAL until the required browser/device checks are completed.

No merge, main-branch write, server connection or deployment was performed.

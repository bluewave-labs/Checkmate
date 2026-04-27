# Plan: Selectable public status page themes

## Goal
Let each status page owner pick from four visual themes for their public status page (`/status/public/:url`). The choice is saved on the `StatusPage` document and rendered without any change to the data flow, routes, or component tree. Also add a light/dark toggle to the public page (not currently possible).

Themes:
- `refined` (default, closest to today)
- `modern`
- `bold`
- `editorial`

Mockups to match: `/Users/gorkemcetin/checkmate-web/public/status-designs/01-refined.html` through `04-editorial.html`.

## Non-goals
- No changes to monitor scheduling, repositories, queue, or status computation
- **No functionality added and no functionality removed.** Every theme renders exactly the same data and the same interactions as the current public status page — company name, logo, overall status banner with all 7 status variants (up / degraded / down / breached / maintenance / paused / initializing), monitor list with name/type/URL/status badge, heatmap/histogram chart toggle, and hardware monitor gauges (CPU/memory/disk/temperature). All existing config toggles (`showCharts`, `showUptimePercentage`, `showInfrastructure`, `isPublished`, `customCSS`, `logo`, `timezone`, `color`) continue to work identically under every theme. This is a presentation-layer refresh — nothing more, nothing less
- No per-theme feature parity drift — if a feature isn't in the real product today, it stays out of all four themes. If it's in the product today, it must work under all four themes
- No custom theme editor — fixed set of four
- No repurposing of the existing unused `color` field on `StatusPage`; it stays as-is
- `customCSS` is out of scope here; it already exists and is applied after theme tokens

## Principles
- **Tokens, not forks.** All four themes are the same component tree rendered with different CSS custom properties plus a small per-theme structural override map. No duplicate `MonitorsList`, `StatusBar`, etc.
- **Defaults stay invisible.** Existing status pages render `refined`, which is visually equivalent to today. No migration required.
- **Presentation layer only.** Backend change is two fields + one validator update.
- **Owner's choice wins on the public page.** If the admin forces `themeMode="light"`, visitor preference and visitor OS setting are ignored for that page.
- **Visitors do not change theme mode.** When `themeMode="auto"`, the visitor's OS preference (`prefers-color-scheme`) decides light vs dark — and that's final. No in-page toggle is exposed to end-visitors. The admin-forced modes (`light`, `dark`) still lock the page to that mode.

---

## Part 1 — Backend (PR 1)

### 1.1 Model
**File:** `server/src/db/models/StatusPage.ts`

Add two fields:

```ts
theme: {
  type: String,
  enum: ["refined", "modern", "bold", "editorial"],
  default: "refined",
},
themeMode: {
  type: String,
  enum: ["auto", "light", "dark"],
  default: "auto",
},
```

No migration needed. Mongoose applies defaults on read for missing fields on existing documents.

### 1.2 Zod validator
**File:** `server/src/validation/statusPageValidation.ts`

Extend `createStatusPageBodyValidation` (same schema reused for update):

```ts
theme: z.enum(["refined", "modern", "bold", "editorial"]).optional(),
themeMode: z.enum(["auto", "light", "dark"]).optional(),
```

Optional so older admin clients keep working.

### 1.3 Controller
**File:** `server/src/controllers/statusPageController.ts`

- `createStatusPage` / `updateStatusPage` — already spread the validated body; confirm in review no explicit allow-list strips the new fields.
- `getStatusPageByUrl` — returns the whole document; confirm `theme` and `themeMode` appear in the JSON response (Mongoose defaults will populate them for legacy docs).

### 1.4 OpenAPI / Swagger
**File:** `server/openapi.json`

Add `theme` and `themeMode` to the StatusPage schema definition and to the create/update request bodies. Include enum values and defaults.

### 1.5 Feature flag (rollback safety)
**File:** `server/src/config/` (or wherever env flags live)

Add `STATUS_PAGE_THEMES_ENABLED` env var, default `true`. If the existing codebase already follows a convention (e.g. `FEATURE_*` prefix), rename to match during review — grep `server/src/config` before merging PR 1. When `false`, the controller strips `theme`/`themeMode` from writes and always responds with `theme: "refined"`, `themeMode: "auto"` on reads. Lets us disable the feature server-side without a rollback if something breaks in prod.

### 1.6 Backend tests
**File:** `server/tests/statusPage.test.ts` (create if missing — check existing patterns)

Specific cases:
- POST create with no `theme` → response and DB both have `theme: "refined"`, `themeMode: "auto"`
- POST create with `theme: "modern"`, `themeMode: "dark"` → persists
- PATCH update changes `theme` and `themeMode` → persists
- POST with `theme: "invalid"` → 400
- POST with `themeMode: "invalid"` → 400
- GET by URL on a legacy document (no `theme` field written) → response has defaults populated
- With `STATUS_PAGE_THEMES_ENABLED=false`, create with `theme: "modern"` → stored value is `"refined"` (or field not stored) and response reflects refined

---

## Part 2 — Frontend (PR 2)

### 2.1 Client type
**File:** wherever `StatusPage` is typed on the client (likely `client/src/Utils/...` or inline in `Pages/StatusPage/Create/index.tsx`)

Add:

```ts
theme?: "refined" | "modern" | "bold" | "editorial";
themeMode?: "auto" | "light" | "dark";
```

Both optional for backward compat with API responses from older servers during rollout.

### 2.2 Theme tokens module
**New file:** `client/src/Pages/StatusPage/Status/themes/tokens.ts`

```ts
export type StatusPageTheme = "refined" | "modern" | "bold" | "editorial";
export type StatusPageThemeMode = "auto" | "light" | "dark";

export interface StatusPageThemeTokens {
  bg: string; surface: string; border: string;
  text: string; textMuted: string;
  up: string; upSoft: string;
  degraded: string; degradedSoft: string;
  down: string; downSoft: string;
  warn: string; warnSoft: string;
  radius: string;
  fontFamily?: string;
  headingFontFamily?: string;
  headingWeight?: number;
  headingLetterSpacing?: string;
  chartBarRadius?: string;
  // per-theme structural flags
  pulseStatusDot?: boolean;
  staggeredCardFadeIn?: boolean;
  conicLogo?: boolean;
  heroSize?: "default" | "large";
  cardStyle?: "card" | "hairline"; // hairline = editorial
}

export const themeTokens: Record<
  StatusPageTheme,
  { light: StatusPageThemeTokens; dark: StatusPageThemeTokens }
>;
```

**Source of truth:** port exact CSS variable values from each mockup's `:root` and `[data-theme="dark"]` blocks. These are the same HTML files already at `/Users/gorkemcetin/checkmate-web/public/status-designs/` so the values are pinned.

### 2.3 Theme provider wrapper
**New file:** `client/src/Pages/StatusPage/Status/themes/StatusPageThemeProvider.tsx`

Responsibilities:
- Read `theme` + `themeMode` from props (passed by the parent `Status` page from the fetched status page document)
- Resolve the active mode with this precedence: admin-forced mode (`themeMode !== "auto"`) > `prefers-color-scheme` > light. Visitors do not have a per-page override.
- Flatten the token object to inline CSS variables (`--sp-bg`, `--sp-up`, etc.) on a wrapper `<div data-status-theme={theme} data-status-mode={resolvedMode} style={cssVars}>`
- Expose a React context with `{ theme, mode, setMode, tokens }` so components can read structural flags without prop drilling

### 2.4 Theme override stylesheet
**New file:** `client/src/Pages/StatusPage/Status/themes/theme-overrides.css`

Scoped stylesheet, selectors all prefixed with `[data-status-theme="..."]`. Covers the three structural differences that aren't expressible as token swaps:

- `[data-status-theme="editorial"]` — serif heading font (**Georgia**, system font, no webfont to keep bundle lean), monitor cards become hairline-divided rows (no card borders, no shadow, bottom border only), flat badges, no rounded corners on charts
- `[data-status-theme="bold"]` — larger hero typography, conic-gradient logo treatment **only when no custom logo is uploaded**. Fallback visual: a conic-gradient disc containing the first letter of the status page's `companyName` as a monogram (matches the "A" shown in the mockup). When a custom logo is uploaded, render it plainly and skip the conic flair
- `[data-status-theme="modern"]` — pulse animation on the status dot, staggered fade-in on monitor cards

All the simple color/radius/spacing differences stay in tokens, not here.

### 2.5 Wire up the public page
**Files to touch (styling only, no structural changes):**
- `client/src/Pages/StatusPage/Status/index.tsx` — wrap `StatusPageView` in `StatusPageThemeProvider`, pass `theme`/`themeMode` from the fetched document
- `client/src/Pages/StatusPage/Status/Components/StatusBar.tsx`
- `client/src/Pages/StatusPage/Status/Components/MonitorsList.tsx`
- `client/src/Pages/StatusPage/Status/Components/MonitorHeader.tsx` (confirm path in review — Explore said "if exists")
- `client/src/Pages/StatusPage/Status/Components/MonitorContent.tsx`
- `client/src/Pages/StatusPage/Status/Components/InfrastructureMetrics.tsx`
- `client/src/Pages/StatusPage/Status/Components/HeaderStatusPageControls.tsx`

Rule: within this subtree, read status-page-specific colors from `var(--sp-up)`, `var(--sp-surface)`, etc. instead of `theme.palette.*`. MUI theme is still used for spacing, breakpoints, and typography defaults.

### 2.6 Chart components — explicit decision
**Files:** `client/src/Components/common/charts/HistogramResponseTime.tsx`, `HeatmapResponseTime.tsx`

These are shared with non-status-page screens. Two options:
1. Leave them reading MUI theme (simplest). Accept that on `bold` dark theme the chart bars may look slightly off-brand versus the mockups.
2. Accept an optional `paletteOverride` prop and pass `{ up, degraded, down }` from the status page theme when rendered inside `StatusPageThemeProvider`.

**Decision:** go with (2). It's a few lines of prop plumbing and keeps the mockups looking right. The components stay backwards-compatible because `paletteOverride` is optional.

### 2.7 Public-page light/dark behaviour (no visitor toggle)
The public page does **not** expose a visitor-facing mode toggle. Per the "Visitors do not change theme mode" principle:
- `themeMode="auto"` → page reads `prefers-color-scheme` at load and **live-updates** via a `matchMedia` listener if the visitor's OS flips mode mid-session
- `themeMode="light"` or `"dark"` → page is locked to that mode regardless of visitor setting

The admin dashboard keeps its global light/dark toggle (unchanged). No new `ThemeModeToggle` component is built; no localStorage key is added.

### 2.8 Admin selector with previews
**File:** `client/src/Pages/StatusPage/Create/Components/HeaderConfigStatusControls.tsx` (confirm in review — may be elsewhere in the `Create/` tree)

- **Access control:** the picker is shown to users who can already edit the status page (admins and team admins — gate on the existing permission check, don't add a new one). Anyone who can save other status page settings can pick a theme.
- Card-style radio group, 2×2 grid on desktop, 1-column on mobile
- Each option card shows:
  - Theme name (translated)
  - 1-line description
  - A **side-by-side light + dark preview** so admins see both modes at a glance (two SVGs per theme rendered next to each other within the card, labelled "Light" / "Dark")
  - On hover, the card enlarges the currently-hovered preview (light or dark depending on cursor position half) — required in PR 2
  - Radio indicator
- Second form control below: `themeMode` dropdown with three options (auto / light / dark), translated
- Hook into the existing form state, write `theme` + `themeMode` to the create/update payload

### 2.9 Preview thumbnails
**Assets:** `client/src/assets/status-themes/{refined,modern,bold,editorial}-{light,dark}.svg` (8 files total)

- Hand-authored SVG, ~260×160 each (sized to sit side-by-side inside an admin card), illustrating the key visual traits of its theme (a simulated status banner + one monitor row with a tiny heatmap)
- Each ≤4KB, no embedded fonts
- Both variants per theme are always rendered in the picker card (not conditionally by admin UI mode) so admins compare light and dark without changing their UI preference
- Committed directly — no bundled screenshots, no external fetches

### 2.10 i18n
**File:** `client/src/locales/en/translation.json` — other locales follow existing contribution flow

Keys to add:
- `statusPage.settings.theme.label`
- `statusPage.settings.theme.description`
- `statusPage.settings.theme.options.refined.name` / `.description`
- `statusPage.settings.theme.options.modern.name` / `.description`
- `statusPage.settings.theme.options.bold.name` / `.description`
- `statusPage.settings.theme.options.editorial.name` / `.description`
- `statusPage.settings.themeMode.label`
- `statusPage.settings.themeMode.description`
- `statusPage.settings.themeMode.auto` / `.light` / `.dark`
- `statusPage.settings.theme.previewLightLabel`
- `statusPage.settings.theme.previewDarkLabel`

### 2.11 Frontend tests
**Component tests (existing test setup):**
- Admin form: selecting a theme card updates form state and survives submit
- Admin form: `themeMode` dropdown changes payload
- `StatusPageThemeProvider`: `auto` mode resolves to `prefers-color-scheme`; admin-forced `light`/`dark` modes win over the OS setting
- Mode resolution: `themeMode="auto"` picks up `prefers-color-scheme`; `themeMode="light"` and `"dark"` lock the mode regardless of OS setting
- Admin picker shows both light + dark preview SVGs for every theme, regardless of admin UI mode
- Jest/Vitest snapshot tests (plain, no visual-regression tool): `Status/index.tsx` rendered under each of `refined | modern | bold | editorial` × `light | dark`. 8 snapshots via a single parametrised test.

### 2.12 Accessibility checks
Run axe (or the existing a11y test harness) against each theme × mode combination before merging. Required passes:
- Body text ≥ 4.5:1 contrast
- Badges, UI component borders, and chart cells ≥ 3:1 contrast
- Editorial in particular: verify the hairline divider between monitor rows clears 3:1 (beige `#e9e4d8` on `#fbfaf7` is ~1.3:1, which fails — darken to ~`#d4cdb8` or heavier)

Adjust tokens if any combination fails. Don't ship failing themes.

---

## Rollout

- **PR 1 (backend)** — model + validator + controller confirmation + OpenAPI + feature flag + tests. No visible change. Shippable independently; older clients keep working; theme is always `refined` in responses because the client ignores the field until PR 2 lands.
- **PR 2 (frontend)** — theme tokens + provider + wire-up + chart palette override + admin picker with previews + public toggle + i18n + tests + axe pass.

Two PRs, small-enough individually to review carefully.

---

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Four themes = 4× visual-regression surface going forward | Parametrised snapshot tests in PR 2 cover all 4 themes × both modes × key status states. Regressions caught at PR time. |
| Editorial hairline dividers fail WCAG 3:1 for UI borders | Axe pass in 2.12; darken divider token until it clears. |
| Older clients posting create/update without `theme` break | Validator makes fields optional; model default handles it. Covered by backend test 1.6. |
| `customCSS` collides with theme tokens | Themes set CSS variables on a wrapper; `customCSS` is injected inline after and can override any `--sp-*` variable. No code change. Document in settings help text. |
| Shared chart components look off-brand on bold/modern dark | Decided in 2.6: pass an optional `paletteOverride` prop from the status page subtree. |
| Rollback needed if feature misbehaves in prod | Feature flag `STATUS_PAGE_THEMES_ENABLED` in 1.5 disables writes and forces `refined` on reads. |
| Admin picker previews go stale as themes drift | SVGs live next to token file; note in `tokens.ts` header comment: "If you change tokens here, update the preview SVGs." A future improvement is to render previews from tokens dynamically; out of scope. |
| Editorial structural override CSS leaks outside status page | All selectors prefixed with `[data-status-theme="..."]`. The wrapper div is scoped to `Status/index.tsx`, so the attribute only exists inside that subtree. |

---

## Out-of-scope parking lot
- Custom theme editor with user-chosen colors
- Per-monitor theme overrides
- Status-page-level favicon + meta theme-color sync
- Live preview pane in admin while editing
- Dynamic preview rendering from tokens (replaces hand-authored SVGs)

---

## Verification checklist before merging each PR

### PR 1 (backend)
- [ ] `theme` + `themeMode` fields added with correct defaults
- [ ] Zod validator accepts valid enums, rejects invalid values
- [ ] Legacy docs (no theme field) return `"refined"`/`"auto"` on GET
- [ ] OpenAPI spec updated and regenerated
- [ ] Feature flag present and tested in both states
- [ ] All tests enumerated in 1.6 pass

### PR 2 (frontend)
- [ ] **Functional parity audit:** walk the pre-change public status page and the post-change page under each of the four themes. Confirm every visible data point, every config toggle, and every interaction (chart type switch, heatmap tooltip, hardware gauge rendering, status variant coloring, logo display, URL display, `customCSS` injection) behaves identically. No feature missing from any theme. No new feature present in any theme.
- [ ] All four mockups render faithfully at `/status-designs/0N-*.html` parity
- [ ] Default case (no theme set) renders indistinguishably from pre-change public page
- [ ] No MUI theme mutations leak outside `Pages/StatusPage/Status/`
- [ ] Admin picker previews render in both light and dark admin UI modes
- [ ] Public page resolves mode correctly: `auto` → OS preference; `light`/`dark` → locked; no visitor-facing toggle exists
- [ ] Bold theme's conic-logo treatment applies only when no custom logo is uploaded; custom logos render plainly
- [ ] Axe passes AA on all 4 × 2 theme/mode combinations, including for chart cells
- [ ] i18n keys added to `en` and loaded without warnings
- [ ] Snapshot tests in place for all theme × mode combinations

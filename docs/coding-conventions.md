# Coding conventions

Style and structural rules the codebase follows. Frontend rules are extracted from review feedback on PR series #3591–#3596; backend rules are extracted from the provider/repository/service layering used across `server/src/service/infrastructure/network/*` and the patterns enforced in code review. These are non-negotiable for new code. They exist to keep the codebase greppable, maintainable, and consistent.

> If you're touching a file in `client/src` the **frontend** rules apply.
> If you're touching a file in `server/src` the **backend** rules apply.
> Rule 0 applies everywhere.

---

## 0. Look at existing implementations and follow the established pattern

Before writing new code, find one or two files that already do something similar — a peer provider for a new monitor type, a peer page for a new admin screen, a peer repository method for a new query — and follow the same shape. Match imports, helper-function placement, naming, error handling, mock-construction style, and assertion idioms. If you're tempted to do it differently, the burden is on you to justify the divergence.

**Why:** consistency is more valuable than locally-optimal cleverness. A reader who has internalized the pattern of one peer file should be able to read the new one with no extra mental load. New shapes also make refactors more expensive — when someone wants to change the convention later, every variant has to be visited and reasoned about separately.

**How to apply:** before writing a new component, page, provider, repository, or test file:

1. Grep for the closest existing peers (e.g. `WebSocketProvider.ts` if you're writing a new monitor provider).
2. Read at least two of them end-to-end.
3. Mirror their structure: same constants at the top (`SERVICE_NAME`, `TIMEOUT_MS`), same import order, same DI shape, same try/catch envelope, same test-file location and helper imports.
4. If your new code needs a shape no peer has, name it explicitly in the PR description and link to the peer you diverged from. Don't sneak novelty in.

**Concrete check before opening a PR:** can a reader open a peer file side-by-side with yours and trace each section in the same order? If not, restructure.

---

# Part 1 — Frontend (`client/src`)

## 1. Prefer MUI native (system) props over `sx`

MUI components accept layout, spacing, color, border, typography and sizing values as top-level props. Use those. Reach for `sx` only when no native prop exists for the value you need (e.g. `textDecoration`, pseudo-selectors, complex selectors, conditional CSS).

**Why:** native props are easier to read in JSX, easier to grep, easier to refactor, and don't force the reader to mentally parse a nested object literal for things that are conceptually one attribute. A `sx` block also can't be split-line-edited cleanly when most of its keys are simple primitives.

**How to apply:** any time you write `sx={{ … }}`, ask whether each key has a native equivalent. If yes, hoist it.

### Canonical mappings

| `sx` key | Native prop |
|---|---|
| `color` | `color` |
| `backgroundColor` | `bgcolor` |
| `borderRadius` | `borderRadius` |
| `border`, `borderTop`, … | `border`, `borderTop`, … |
| `width`, `height`, `minHeight`, `maxWidth` | same names as native |
| `p`, `pt`, `pb`, `px`, `py` | same names as native |
| `m`, `mt`, `mb`, `mx`, `my` | same names as native |
| `display` | `display` |
| `textAlign` | `textAlign` |
| `fontWeight`, `fontSize`, `lineHeight` | same names as native |
| `gap` (on Stack) | `gap` |

### Examples

```tsx
// BAD — everything inside sx
<Box
  sx={{
    width: "100%",
    p: theme.spacing(LAYOUT.MD),
    borderRadius: 1,
    border: `1px solid ${alpha(tone, 0.45)}`,
    backgroundColor: alpha(tone, 0.08),
    textAlign: "left",
  }}
/>

// GOOD — every key that has a native prop is hoisted
<Box
  width="100%"
  p={theme.spacing(LAYOUT.MD)}
  borderRadius={theme.shape.borderRadius}
  border={`1px solid ${alpha(tone, 0.45)}`}
  bgcolor={alpha(tone, 0.08)}
  textAlign="left"
/>
```

```tsx
// BAD
<Typography sx={{ color: theme.palette.text.primary, lineHeight: 1.55, fontSize: 13 }}>

// GOOD — hoist what you can; drop fontSize:13 because it's the body default
<Typography
  color={theme.palette.text.primary}
  lineHeight={1.55}
>
```

### When `sx` is still correct

Keep `sx` for things that don't have a native prop:

```tsx
<Link
  component={RouterLink}
  to="/settings"
  color={theme.palette.primary.main}
  fontWeight={600}
  sx={{ textDecoration: "underline" }}   // OK — no native prop for textDecoration
/>
```

Pseudo-selectors (`"&:hover"`), `transition`, `cursor`, `outline`, `overflow` (when not on Box/Stack), media queries, and conditional spread objects all stay in `sx`.

---

## 2. Use the full theme path for colors, never the shorthand string

Prop forms like `color="text.secondary"`, `color="primary.main"`, `bgcolor="background.paper"` work, but they are **forbidden in this codebase**.

**Why:** the shorthand is invisible to grep. If a future change needs to find every place that consumes `theme.palette.text.secondary` — to retheme, to swap, to audit — the shorthand strings are missed. That is a maintenance trap. It's worth a few extra characters at every callsite to keep the codebase searchable.

**How to apply:** always destructure or reference the theme value explicitly.

```tsx
// BAD
<Typography color="text.secondary">…</Typography>
<Typography color="primary.main">…</Typography>

// GOOD
const theme = useTheme();
<Typography color={theme.palette.text.secondary}>…</Typography>
<Typography color={theme.palette.primary.main}>…</Typography>
```

This applies to every theme-aware string prop (`color`, `bgcolor`, `borderColor`, etc.), and inside `sx` if you really need it there.

---

## 3. No hardcoded numeric or string literals — use tokens

The theme exposes tokens for every kind of magic value. Use them. Reserve raw numbers for values that are genuinely one-off (and even then, push back on yourself first).

**Why:** tokens are the single source of truth. A literal `2` in a `mt` prop is invisible — it could mean `LAYOUT.XXS`, a rounding correction, or a thinko. The reader can't tell. With a token, intent is in the name.

**How to apply:** before writing a literal, check whether one of these tokens covers it. If it nearly does but not exactly, extend the token rather than hardcoding (Alex did exactly this — he added `LAYOUT.XXS = 2` rather than letting `mt: "2px"` stand).

### Token sources

- **Spacing / layout** — `client/src/Utils/Theme/constants.ts`
  - `LAYOUT.XXS = 2` · `LAYOUT.XS = 4` · `LAYOUT.SM = 6` · `LAYOUT.MD = 8` · `LAYOUT.LG = 10` · `LAYOUT.XL = 12` · `LAYOUT.XXL = 16`
  - `SPACING` for `theme.spacing(...)` multipliers
- **Typography sizes** — `client/src/Utils/Theme/Palette.ts` → `typographyLevels`
  - `xs / s / m / l / xl / xxl` (rem values)
- **Hover / interaction** — `HOVER.DARKEN` etc.
- **Shape** — `theme.shape.borderRadius` (don't write `borderRadius: 1` or `borderRadius: 4`)
- **Colors** — `theme.palette.*` (rule 2 above)

### Examples

```tsx
// BAD
<Box sx={{ mt: "2px" }} />
<Stack spacing={theme.spacing(2)} />
<Box sx={{ borderRadius: 1 }} />
<Typography fontSize={18} />
<Typography fontSize={13} />   // 13 is the body default — drop the prop entirely

// GOOD
<Box mt={LAYOUT.XXS} />
<Stack spacing={theme.spacing(LAYOUT.XXS)} />
<Box borderRadius={theme.shape.borderRadius} />
<Typography fontSize={typographyLevels.xl} />
<Typography />   // inherits 13px from theme
```

### Token naming gotcha

`typographyLevels.xl` was historically used for both 18px and 23px callsites. Don't reuse a token for two different purposes — split it (`xl` = 18, `xxl` = 23) and update every callsite. If you find an ambiguous token while editing, fix it the same way.

---

## 4. Use `useTheme()` inside components, don't import the theme module

The `theme` object exported from `@/Utils/Theme/Theme` is the *factory output*, not a live, mode-aware instance. Importing it directly couples a component to the wrong reference and breaks dark-mode reactivity. It also breaks the build at import time in some module-graph configurations (this happened in PR #3596 and required a follow-up commit).

**Why:** themes can change at runtime (mode toggle), and the hook is the only correct way to read the active theme. Imports also create circular-graph risk because `Theme.ts` itself depends on `Palette.ts`.

**How to apply:** inside any component or component-helper that needs theme values:

```tsx
// BAD
import { theme } from "@/Utils/Theme/Theme";
const SectionHeading = ({ children }) => (
  <Typography color={theme.palette.text.secondary}>{children}</Typography>
);

// GOOD
import { useTheme } from "@mui/material/styles";
const SectionHeading = ({ children }) => {
  const theme = useTheme();
  return <Typography color={theme.palette.text.secondary}>{children}</Typography>;
};
```

Module-level utility files that don't render React (pure helpers) should accept `theme` as a parameter rather than importing it.

---

## 5. Discriminated unions: pair the runtime list with the type

When you have a closed set of string literals that's used both as a type and as runtime data (severities, statuses, kinds), declare the runtime tuple first and derive the type from it. Don't declare them as two parallel literals that can drift.

**Why:** if the list and the type aren't tied to each other, adding a new value to one and forgetting the other compiles fine and breaks at runtime. Deriving the type from the tuple makes them inseparable.

```tsx
// BAD
type Severity = "info" | "warning" | "error";

// GOOD
export const Severities = ["info", "warning", "error"] as const;
export type Severity = (typeof Severities)[number];
```

Export both when callers need to iterate (e.g. for a Storybook stories matrix or a select dropdown).

---

# Part 2 — Backend (`server/src`)

## 6. Layering: Controller → Service → Repository → Mongoose

The backend enforces a strict three-layer separation between HTTP handling, business logic, and data access. Every new feature follows this path, no shortcuts.

```
Request → Controller → Service → Repository → MongoDB (Mongoose)
```

**Why:** this is what makes each layer independently testable. Mongoose calls in services force services to mock the database in tests; raw DB queries in controllers couple HTTP shape to schema shape and turn every refactor into a multi-file rewrite.

**How to apply:** when adding a new feature, the pattern is — **add a repository method** for any new DB query, **call it from a service**, **expose it via a controller**. If a service constructs a `MonitorModel.findOne({...})`, you've broken the rule; the query belongs in the repository.

- **Controllers** (`server/src/controllers/`) handle HTTP concerns only: parse params, call the service, return via the `responseHandler` middleware. No business logic.
- **Services** (`server/src/service/business/`) contain all business logic. They throw `AppError` on validation/auth failures; they do not write directly to MongoDB.
- **Repositories** (`server/src/repositories/`) are the sole layer that talks to MongoDB. They expose clean query methods (`findByMonitorId`, `createCheck`, `updateStatusWindowAndChecks`) and return entities — never Mongoose documents — via a `toEntity` private helper.

---

## 7. Provider conventions for `service/infrastructure/network/*`

Every monitor-type provider implements `IStatusProvider<TPayload>` and follows the same skeleton.

**Why:** the registry in `services.ts` builds providers identically (`new XxxProvider(deps)`) and `NetworkService` invokes them identically (`provider.handle(monitor)`). If your provider's shape diverges, the registry/dispatch becomes asymmetric and `NetworkService` grows special cases.

**How to apply:** copy the structure of a recent peer (`WebSocketProvider`, `GrpcProvider`, `PortProvider`). The skeleton:

```ts
const SERVICE_NAME = "XxxProvider";
const TIMEOUT_MS = 10000;

type ClientCtor = typeof SomeNodeStdlibClass;

export class XxxProvider implements IStatusProvider<XxxStatusPayload> {
  readonly type = "xxx";

  constructor(private Client: ClientCtor) {}

  supports(type: MonitorType): boolean {
    return type === "xxx";
  }

  async handle(monitor: Monitor): Promise<MonitorStatusResponse<XxxStatusPayload>> {
    try {
      // 1. validate inputs → throw AppError(400) on bad input
      // 2. set up the client (use this.Client, never imported singleton)
      // 3. perform the call inside timeRequest(...), with a setTimeout race
      //    in the Promise body to enforce TIMEOUT_MS
      // 4. return MonitorStatusResponse with payload
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const originalMessage = err instanceof Error ? err.message : String(err);
      throw new AppError({
        message: originalMessage || "Error performing xxx check",
        status: 500,
        service: SERVICE_NAME,
        method: "handle",
        details: { /* monitor-shaped context */ },
      });
    }
  }
}
```

### Hard rules

- **DI for all external dependencies.** `typeof WebSocket`, `typeof net` — pass the constructor in via the provider's constructor. Never `import { Foo } from "some/library"` and call it inside `handle()`. This is the single thing that makes the provider unit-testable without `jest.unstable_mockModule`.
- **`SERVICE_NAME` and `TIMEOUT_MS`** as module-level constants near the top, not magic strings/numbers in the body.
- **Use the shared `timeRequest()` helper** from `service/infrastructure/network/utils.ts` to measure latency. Don't roll your own `process.hrtime()`.
- **Enforce a hard timeout.** Every peer provider inlines a `setTimeout` race in the Promise body around the underlying client call (see `WebSocketProvider.ts`); sockets, DNS resolvers, and external clients can hang indefinitely without it. There is no shared `withTimeout` helper today — match the inline pattern.
- **Outer try/catch** that converts unknown errors to `AppError({ service, method, details })` while letting your own `AppError` pass through.

---

## 8. Mongoose schema fields with closed value sets

If a field's TypeScript type is a closed union (status, type, record type), the Mongoose schema must declare the same set as `enum`.

**Why:** the validator and the schema are independent gates. A service-layer Zod check can be bypassed (imports, migrations, direct repo writes). A schema `enum` is the last line of defense and surfaces invalid data as a Mongoose validation error rather than silently accepting `"badtype"` and breaking downstream consumers.

**How to apply:** when you add a string field whose values are constrained by a const tuple in `types/`, reuse the same const for the schema enum:

```ts
// types/monitor.ts (existing)
export const MonitorMatchMethods = ["equal", "include", "regex"] as const;

// db/models/Monitor.ts
{
  matchMethod: {
    type: String,
    enum: MonitorMatchMethods,
  },
}
```

The same applies to `MonitorTypes`, `MonitorStatuses`, and any new closed-set field.

---

## 9. Test conventions for `server/test/unit/providers/network/*`

Each provider gets a unit test file at `server/test/unit/providers/network/<providerName>.test.ts`. Follow the structure used by `webSocketProvider.test.ts`, `grpcProvider.test.ts`, `portProvider.test.ts`.

**Why:** consistency lets reviewers diff a new test file against any peer and only see the actual logic differences, not framework/import noise. It also lets the `testStatusProviderContract` helper guarantee every provider satisfies the `IStatusProvider` contract.

**How to apply:**

- **Imports**: `from "@jest/globals"` (not the global `jest`), and `.ts` extensions on every relative import.
- **Contract test**: call `testStatusProviderContract("XxxProvider", { create, supportedType, unsupportedType, makeMonitor })` before the per-test `describe` block.
- **Mock construction**: build the constructor mock as `jest.fn().mockImplementation(() => mock) as unknown as typeof Client` (typed cast, not `as any`).
- **`makeMonitor` factory**: takes `Partial<Monitor>` overrides, spreads onto a baseline, returns `as Monitor`.
- **Inline `setup()` per test** rather than `beforeEach` shared state. Each test should construct its own mock + provider, so a single test can be read in isolation:

  ```ts
  const setup = () => {
    const mock = createMockClient();
    const Ctor = jest.fn().mockImplementation(() => mock) as unknown as typeof Client;
    const provider = new XxxProvider(Ctor);
    return { mock, provider };
  };

  it("does X", async () => {
    const { mock, provider } = setup();
    // ...
  });
  ```

- **Assertion style**: individual `expect(result.field).toBe(...)` lines or `expect(result).toEqual(expect.objectContaining({...}))`. Both are used; pick what reads cleanest for the case.
- **Test naming**: lowercase imperative ("returns success when connection opens", "uses the configured timeout", "throws AppError when host is missing").

---

## 10. Validation: centralize, don't inline

Whenever the same string-set or shape constraint appears in two or more validators, lift it into `types/` as a const tuple and `import` it into both validators. Don't inline `z.enum(["A", "AAAA", ...])` in three places.

**Why:** drift. Three inline copies will eventually disagree — someone adds a new value to one and forgets the other two. The validator silently accepts it on `POST /monitors` and rejects it on `PATCH`, leading to bug reports the author can't reproduce.

**How to apply:** keep validation source-of-truth in `server/src/types/*.ts` as paired const tuples + derived types (rule 5). The validators in `server/src/validation/*.ts` and the Mongoose schemas in `server/src/db/models/*.ts` import from `types/` and reuse the same tuple.

---

## 11. OpenAPI: response schemas live in the validator file

The OpenAPI `monitorObject` (and friends) are generated from a `monitorResponseSchema` Zod object exported from the validator file, not hand-built in `server/openapi/routes/`. When you add a field to the data model, add it to the response schema in the same edit.

**Why:** the spec is auto-generated. If the response schema doesn't list a field, SDK consumers don't see it, even though the server returns it. That's a silent contract gap.

**How to apply:** when you add an entity field, update three files in the same PR:

1. `types/<entity>.ts` — add the field to the TS interface.
2. `db/models/<Entity>.ts` — add the Mongoose schema entry (with `enum` if the value set is closed; rule 8).
3. `validation/<entity>Validation.ts` — add the field to the response schema (and create/edit body schemas if it's user-settable).

The repository's `toEntity` helper also needs to surface the new field; that's part of the change, not a separate one.

---

# Pre-PR checklist

Before opening a PR, grep your diff for the patterns below. Each item describes the **anti-pattern** to find and fix; if your diff has none, that line passes. Frontend section applies to `client/src`; backend to `server/src`.

## Universal
- [ ] I can name the peer file I used as a template, and my file's structure mirrors it (rule 0).
- [ ] `npm run build` and `npm run format-check` are clean in both `client/` and `server/`.

## Frontend (`client/src`)
- [ ] No `sx={{ … }}` block containing keys with a native-prop equivalent (rule 1).
- [ ] No `color="text.X"`, `bgcolor="background.X"`, or other short-string palette paths (rule 2).
- [ ] No raw number or px-string in spacing / margin / padding / fontSize / borderRadius props that should be a token (rule 3).
- [ ] No `import { theme } from "@/Utils/Theme/Theme"` inside a component (rule 4).
- [ ] No `type X = "a" | "b" | "c"` for a closed set used at runtime (rule 5).

## Backend (`server/src`)
- [ ] No `MonitorModel.findOne` (or similar Mongoose call) outside `repositories/` (rule 6).
- [ ] No provider that imports its underlying client at module top instead of receiving it via constructor DI (rule 7).
- [ ] No provider missing `SERVICE_NAME` / `TIMEOUT_MS` / `AppError` outer catch / `timeRequest()` / inline timeout (rule 7).
- [ ] No closed-set string field on a Mongoose schema without an `enum` (rule 8).
- [ ] No provider test that uses `beforeEach` instead of inline `setup()` (rule 9).
- [ ] No duplicated `z.enum([...])` literal that should reference a `types/*` const tuple (rule 10).
- [ ] No new entity field missing from `monitorResponseSchema` (or peer response schema) for OpenAPI (rule 11).

A clean PR on these axes is a PR that ships without a normalize follow-up.

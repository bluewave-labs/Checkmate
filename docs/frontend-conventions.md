# Frontend conventions

Style and structural rules the client codebase follows. These are extracted from review feedback on the PR series #3591–#3596 and are non-negotiable for new code. They exist to keep the codebase greppable, maintainable, and consistent with the existing theme.

> If you're touching a file in `client/src`, every rule below applies. The "why" matters as much as the "what" — read the reasoning so you can judge edge cases.

---

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
  width={"100%"}
  p={theme.spacing(LAYOUT.MD)}
  borderRadius={theme.shape.borderRadius}
  border={`1px solid ${alpha(tone, 0.45)}`}
  bgcolor={alpha(tone, 0.08)}
  textAlign={"left"}
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

## Pre-PR checklist

Before you open a PR, scan your diff for these:

- [ ] Any `sx={{ … }}` block that contains keys with a native-prop equivalent (rule 1)
- [ ] Any `color="text.X"`, `bgcolor="background.X"`, or any short-string palette path (rule 2)
- [ ] Any raw number or px-string in spacing / margin / padding / fontSize / borderRadius props that should be a token (rule 3)
- [ ] Any `import { theme } from "@/Utils/Theme/Theme"` inside a component (rule 4)
- [ ] Any `type X = "a" | "b" | "c"` for a closed set used at runtime (rule 5)
- [ ] Run `npm run build` and `npm run format-check` in both `client/` and `server/` (per global instructions)

A clean PR on these axes is a PR that ships without a normalize follow-up.

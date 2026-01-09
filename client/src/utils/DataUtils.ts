const MIN_OUT = 10;
const MAX_OUT = 100;

export const normalizeResponseTimes = <
  T,
  K extends keyof T,
>(
  checks: T[],
  key: K
): (T & { normalResponseTime: number })[] => {
  if (!Array.isArray(checks) || checks.length === 0)
    return checks as (T & {
      normalResponseTime: number;
    })[];

  if (checks.length === 1) {
    return [
      {
        ...checks[0],
        normalResponseTime: 50,
      },
    ];
  }

  const getVal = (check: T): number => {
    const v = check[key] as unknown;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };

  const { min, max } = checks.reduce(
    (acc, check) => {
      const v = getVal(check);
      if (v > acc.max) acc.max = v;
      if (v < acc.min) acc.min = v;
      return acc;
    },
    { max: -Infinity, min: Infinity }
  );

  const range = max - min || 1;

  return checks.map((check) => ({
    ...check,
    normalResponseTime:
      MIN_OUT + ((getVal(check) - min) * (MAX_OUT - MIN_OUT)) / range,
  }));
};

// Return a color based on response time thresholds.
// Uses distinct color bands instead of interpolation to avoid muddy colors.
// Based on industry standards:
// - Google/MDN: <200ms instant, 200ms-1s acceptable, >1s problematic
// - Nielsen Norman Group: 1s is where users lose feeling of direct interaction
//
// Thresholds:
// 0-500ms: green (good) - instant to acceptable range
// 500ms-1000ms: yellow/amber (warning) - starting to feel slow
// >1000ms: red (slow) - problematic, needs attention
export const getResponseColor = (
  ms: number,
  colors: {
    start: string | undefined;
    mid: string | undefined;
    end: string | undefined;
  }
): string => {
  const safe = { ...colors };
  if (!safe.start) safe.start = "#22c55e"; // green
  if (!safe.mid) safe.mid = "#eab308"; // yellow/amber
  if (!safe.end) safe.end = "#ef4444"; // red

  const normalizeToHex = (value: string) => {
    const v = value.trim();
    if (v.startsWith("#")) {
      const h = v.slice(1);
      const full =
        h.length === 3
          ? h
              .split("")
              .map((c) => c + c)
              .join("")
          : h.substring(0, 6);
      return `#${full.toLowerCase()}`;
    }
    const m = v
      .replace(/\s+/g, "")
      .match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(0|0?\.\d+|1))?\)$/i);
    if (m) {
      const r = parseInt(m[1], 10);
      const g = parseInt(m[2], 10);
      const b = parseInt(m[3], 10);
      const toHex = (c: number) => c.toString(16).padStart(2, "0");
      const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
      return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;
    }
    return "#7f7f7f";
  };

  const v = Math.max(0, ms);
  if (v <= 500) {
    return normalizeToHex(safe.start);
  }
  if (v <= 1000) {
    return normalizeToHex(safe.mid);
  }
  return normalizeToHex(safe.end);
};

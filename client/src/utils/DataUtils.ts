const MIN_OUT = 10;
const MAX_OUT = 100;

export const normalizeResponseTimes = <
  T extends Record<K, number>,
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

  const { min, max } = checks.reduce(
    (acc, check) => {
      if (check[key] > acc.max) acc.max = check[key];
      if (check[key] < acc.min) acc.min = check[key];
      return acc;
    },
    { max: -Infinity, min: Infinity }
  );

  const range = max - min || 1;

  return checks.map((check) => ({
    ...check,
    normalResponseTime:
      MIN_OUT + ((check[key] - min) * (MAX_OUT - MIN_OUT)) / range,
  }));
};

// Interpolate color between three theme colors over 0-100 range.
// 0-50 => start (success.light), 50-75 => mid (warning.light), 75-100 => end (error.light)
export const getResponseColor = (
  ms: number,
  colors: {
    start: string | undefined;
    mid: string | undefined;
    end: string | undefined;
  }
): string => {
  // New ranges with open high end:
  // 0–300ms: interpolate start (good) -> mid (warning)
  // 300–600ms: interpolate mid (warning) -> end (error)
  // >600ms: solid end (error)
  const safe = { ...colors };
  if (!safe.start) safe.start = "#4caf50"; // fallback green
  if (!safe.mid) safe.mid = "#ff9800"; // fallback orange
  if (!safe.end) safe.end = "#f44336"; // fallback red

  const parseHex = (hex: string) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

  const v = Math.max(0, ms);
  if (v <= 300) {
    const t = v / 300; // 0..1 from start->mid
    const s = parseHex(safe.start);
    const m = parseHex(safe.mid);
    const r = mix(s.r, m.r, t);
    const g = mix(s.g, m.g, t);
    const b = mix(s.b, m.b, t);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  if (v <= 600) {
    const t = (v - 300) / 300; // 0..1 from mid->end
    const m = parseHex(safe.mid);
    const e = parseHex(safe.end);
    const r = mix(m.r, e.r, t);
    const g = mix(m.g, e.g, t);
    const b = mix(m.b, e.b, t);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  return safe.end;
};

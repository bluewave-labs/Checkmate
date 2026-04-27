const MIN_OUT = 10;
const MAX_OUT = 100;

export const normalizeResponseTimes = <T, K extends keyof T>(
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
		normalResponseTime: MIN_OUT + ((getVal(check) - min) * (MAX_OUT - MIN_OUT)) / range,
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

	const toHex = (c: number) => c.toString(16).padStart(2, "0");
	const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
	const rgbToHex = (r: number, g: number, b: number) =>
		`#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;

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
			return rgbToHex(r, g, b);
		}
		// Fallback neutral
		return "#7f7f7f";
	};

	const parseHex = (hex: string) => {
		const h = hex.replace("#", "");
		const full =
			h.length === 3
				? h
						.split("")
						.map((c) => c + c)
						.join("")
				: h;
		const n = parseInt(full, 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
	};
	const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

	const v = Math.max(0, ms);
	if (v <= 300) {
		const t = v / 300; // 0..1 from start->mid
		const s = parseHex(normalizeToHex(safe.start));
		const m = parseHex(normalizeToHex(safe.mid));
		const r = mix(s.r, m.r, t);
		const g = mix(s.g, m.g, t);
		const b = mix(s.b, m.b, t);
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	if (v <= 600) {
		const t = (v - 300) / 300; // 0..1 from mid->end
		const m = parseHex(normalizeToHex(safe.mid));
		const e = parseHex(normalizeToHex(safe.end));
		const r = mix(m.r, e.r, t);
		const g = mix(m.g, e.g, t);
		const b = mix(m.b, e.b, t);
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	return normalizeToHex(safe.end);
};

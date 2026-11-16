// Frame-driven animation helpers for the "What's new" illustrations.
// Every scene is a pure function of the elapsed time t (seconds), Remotion-style, so a frame can be
// rendered at any point (scrubbing, reduced motion) and text inside the SVG comes from translations.

export const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));
export const mix = (from: number, to: number, progress: number) =>
	from + (to - from) * progress;

const bezier = (x1: number, y1: number, x2: number, y2: number) => {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
	return (x: number) => {
		let t = x;
		for (let i = 0; i < 6; i++) {
			const slope = slopeX(t);
			if (Math.abs(slope) < 1e-6) break;
			t -= (sampleX(t) - x) / slope;
		}
		return sampleY(clamp(t, 0, 1));
	};
};

export const Ease = {
	linear: (t: number) => t,
	smooth: bezier(0.22, 1, 0.36, 1),
	inOut: bezier(0.65, 0, 0.35, 1),
	out: (t: number) => 1 - Math.pow(1 - t, 3),
};

// interpolate(t, [t0, t1], [from, to]) with clamping
export const lerp = (
	t: number,
	t0: number,
	t1: number,
	from: number,
	to: number,
	ease: (t: number) => number = Ease.inOut
) => mix(from, to, ease(clamp((t - t0) / (t1 - t0), 0, 1)));

export interface SpringConfig {
	stiffness: number;
	damping: number;
	mass?: number;
}

export const SNAPPY: SpringConfig = { stiffness: 320, damping: 28 };
export const SMOOTH: SpringConfig = { stiffness: 140, damping: 24 };
export const BOUNCY: SpringConfig = { stiffness: 300, damping: 15 };

// Damped spring from 0 to 1, analytic solution
export const spring = (t: number, delay = 0, config: SpringConfig = SMOOTH) => {
	const x = t - delay;
	if (x <= 0) return 0;
	const { stiffness, damping, mass = 1 } = config;
	const w0 = Math.sqrt(stiffness / mass);
	const zeta = damping / (2 * Math.sqrt(stiffness * mass));
	if (zeta < 1) {
		const wd = w0 * Math.sqrt(1 - zeta * zeta);
		return (
			1 -
			Math.exp(-zeta * w0 * x) *
				(Math.cos(wd * x) + ((zeta * w0) / wd) * Math.sin(wd * x))
		);
	}
	if (Math.abs(zeta - 1) < 1e-6) return 1 - (1 + w0 * x) * Math.exp(-w0 * x);
	const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
	const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
	return 1 - (r2 * Math.exp(r1 * x) - r1 * Math.exp(r2 * x)) / (r2 - r1);
};

// In-then-out, built from two springs
export const pulse = (t: number, tin: number, tout: number, config = SNAPPY) =>
	spring(t, tin, config) - spring(t, tout, config);

export type CursorKey = readonly [time: number, x: number, y: number];

// Cursor position along keyframes, eased between keys, held outside them
export const cursorPos = (t: number, keys: readonly CursorKey[]): [number, number] => {
	const first = keys[0];
	if (t <= first[0]) return [first[1], first[2]];
	for (let i = 0; i < keys.length - 1; i++) {
		const [t0, x0, y0] = keys[i];
		const [t1, x1, y1] = keys[i + 1];
		if (t <= t1) {
			const p = Ease.inOut(clamp((t - t0) / (t1 - t0), 0, 1));
			return [mix(x0, x1, p), mix(y0, y1, p)];
		}
	}
	const last = keys[keys.length - 1];
	return [last[1], last[2]];
};

// Text swap: the old text fades up and out, the new one fades in from below
export const swap = (t: number, at: number, from: string, to: string) => {
	const half = 0.14;
	if (t < at) return { text: from, opacity: 1, dy: 0 };
	if (t < at + half) {
		const p = (t - at) / half;
		return { text: from, opacity: 1 - p, dy: -4 * p };
	}
	const p = Ease.smooth(clamp((t - at - half) / half, 0, 1));
	return { text: to, opacity: p, dy: 4 * (1 - p) };
};

// SVG transform string: translate, then scale around an origin
export const transform = ({
	x = 0,
	y = 0,
	s = 1,
	sx,
	sy,
	ox = 0,
	oy = 0,
}: {
	x?: number;
	y?: number;
	s?: number;
	sx?: number;
	sy?: number;
	ox?: number;
	oy?: number;
}) =>
	`translate(${x + ox} ${y + oy}) scale(${sx ?? s} ${sy ?? s}) translate(${-ox} ${-oy})`;

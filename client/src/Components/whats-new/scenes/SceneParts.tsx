import type { ReactNode } from "react";
import {
	Ease,
	clamp,
	cursorPos,
	lerp,
	pulse,
	spring,
	transform,
	type CursorKey,
} from "@/Components/whats-new/motion";
import {
	LOOP_FADE,
	SCENE_HEIGHT,
	SCENE_WIDTH,
	useScenePalette,
} from "@/Components/whats-new/scenes/sceneTheme";

interface SceneSvgProps {
	t: number;
	duration: number;
	children: ReactNode;
}

export const SceneSvg = ({ t, duration, children }: SceneSvgProps) => {
	const p = useScenePalette();
	// Soft fade at the loop point so the restart doesn't jump
	const opacity = t > duration - LOOP_FADE ? (duration - t) / LOOP_FADE : 1;
	return (
		<svg
			viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
			width="100%"
			height="100%"
			fontFamily={p.fontFamily}
			opacity={opacity}
			aria-hidden="true"
		>
			<defs>
				<filter
					id="whats-new-shadow"
					x="-20%"
					y="-20%"
					width="140%"
					height="160%"
				>
					<feDropShadow
						dx="0"
						dy="6"
						stdDeviation="7"
						floodColor={p.shadow}
						floodOpacity="0.22"
					/>
				</filter>
			</defs>
			{children}
		</svg>
	);
};

interface CursorProps {
	t: number;
	keys: readonly CursorKey[];
	showAt: number;
	hideAt: number;
	presses?: readonly number[];
}

// Pointer that follows keyframes, with a press squash and a ripple on each click
export const Cursor = ({ t, keys, showAt, hideAt, presses = [] }: CursorProps) => {
	const p = useScenePalette();
	const [x, y] = cursorPos(t, keys);
	const opacity = Math.min(
		lerp(t, showAt, showAt + 0.25, 0, 1),
		lerp(t, hideAt, hideAt + 0.25, 1, 0)
	);
	const press = presses.reduce((max, at) => Math.max(max, pulse(t, at, at + 0.14)), 0);
	const ripple = presses.find((at) => t >= at && t < at + 0.5);
	const rp = ripple === undefined ? 0 : (t - ripple) / 0.5;
	return (
		<g>
			{ripple !== undefined && (
				<circle
					cx={x + 1}
					cy={y + 1}
					r={4 + 14 * Ease.out(rp)}
					fill="none"
					stroke={p.primary}
					strokeWidth="2"
					opacity={0.45 * (1 - rp)}
				/>
			)}
			<g
				opacity={clamp(opacity, 0, 1)}
				transform={transform({ x, y, s: 1 - 0.12 * press })}
			>
				<path
					d="M0 0 L0 15 L4 11.5 L6.8 17.5 L9.2 16.4 L6.4 10.6 L11.5 10.6 Z"
					fill={p.ink}
					stroke={p.card}
					strokeWidth="1.2"
					strokeLinejoin="round"
				/>
			</g>
		</g>
	);
};

interface CheckBadgeProps {
	t: number;
	at: number;
	cx: number;
	cy: number;
	r?: number;
}

// transitions.dev success check, as a frame function
export const CheckBadge = ({ t, at, cx, cy, r = 9 }: CheckBadgeProps) => {
	const p = useScenePalette();
	const e = Ease.smooth(clamp((t - at) / 0.5, 0, 1));
	const bob = spring(t, at, { stiffness: 260, damping: 18 });
	const draw = lerp(t, at + 0.08, at + 0.58, 0, 1, Ease.smooth);
	return (
		<g
			opacity={e}
			transform={`translate(0 ${14 * (1 - bob)}) rotate(${80 * (1 - e)} ${cx} ${cy})`}
		>
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill={p.up}
			/>
			<path
				d={`M${cx - r * 0.42} ${cy} l${r * 0.32} ${r * 0.32} l${r * 0.6} -${r * 0.66}`}
				fill="none"
				stroke={p.card}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray="16"
				strokeDashoffset={16 * (1 - draw)}
			/>
		</g>
	);
};

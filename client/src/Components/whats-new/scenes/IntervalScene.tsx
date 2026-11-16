import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import {
	Ease,
	clamp,
	cursorPos,
	lerp,
	spring,
	swap,
	transform,
	BOUNCY,
	SMOOTH,
	type CursorKey,
} from "@/Components/whats-new/motion";
import { Cursor, SceneSvg } from "@/Components/whats-new/scenes/SceneParts";
import { SHADOW, useScenePalette } from "@/Components/whats-new/scenes/sceneTheme";
import { formatDuration } from "@/Utils/TimeUtils";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatNumber } from "@/Utils/FormatUtils";

// Mirrors the create-monitor frequency field: the default 1 minute changes to 6 hours
export const INTERVAL_SCENE_DURATION = 8.6;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DEFAULT_INTERVAL = MINUTE_MS;
const PICKED_INTERVAL = 6 * HOUR_MS;
const MENU_OPTIONS = [
	30 * MINUTE_MS,
	HOUR_MS,
	2 * HOUR_MS,
	PICKED_INTERVAL,
	12 * HOUR_MS,
	DAY_MS,
] as const;
const ROW = 25;
const MENU_X = 70;
const MENU_Y = 108;
const TICKS = 72;
const TIMELINE_X = 372;
const TIMELINE_W = 220;
const TIMELINE_Y = 153;
const HOUR_LABELS = ["00:00", "06:00", "12:00", "18:00", "24:00"] as const;
const CURSOR_KEYS: readonly CursorKey[] = [
	[0.7, 620, 300],
	[1.25, 250, 114],
	[1.6, 250, 114],
	[1.85, 200, 160],
	[2.35, 200, 190],
	[2.85, 200, 220],
	[3.35, 200, 220],
	[3.9, 260, 300],
	[4.2, 640, 320],
];
const PICK_AT = 3.3;

export const IntervalScene = ({ time }: { time: number }) => {
	const { t, i18n } = useTranslation();
	const p = useScenePalette();
	const locale = i18n.resolvedLanguage;
	const label = (ms: number) => formatDuration(ms, { long: true, locale });
	const checksPerDay = (interval: number) => {
		const count = DAY_MS / interval;
		return t("components.whatsNew.scene.interval.checksPerDay", {
			count,
			formatted: formatNumber(count, i18n.language),
		});
	};

	const form = spring(time, 0, SMOOTH);
	const day = spring(time, 0.12, SMOOTH);
	// Dropdown: scale 0.97 from the trigger, 250ms open, 150ms close (transitions.dev)
	const menu =
		lerp(time, 1.45, 1.7, 0, 1, Ease.smooth) *
		(1 - lerp(time, 3.25, 3.4, 0, 1, Ease.smooth));
	// The highlight follows the hovered row, smoothed so it slides between rows
	const rowAt = (at: number) =>
		clamp(
			Math.floor((cursorPos(at, CURSOR_KEYS)[1] - (MENU_Y + 30)) / ROW),
			0,
			MENU_OPTIONS.length - 1
		);
	let highlightY = 0;
	for (let k = 0; k < 6; k++)
		highlightY += (MENU_Y + 30 + rowAt(time - k * 0.03) * ROW) / 6;
	const selected = swap(time, PICK_AT, label(DEFAULT_INTERVAL), label(PICKED_INTERVAL));
	const count = swap(
		time,
		4.3,
		checksPerDay(DEFAULT_INTERVAL),
		checksPerDay(PICKED_INTERVAL)
	);
	const nextDot = spring(time, 5.3, SMOOTH);
	const next = spring(time, 5.6, SMOOTH);

	return (
		<SceneSvg
			t={time}
			duration={INTERVAL_SCENE_DURATION}
		>
			<g
				opacity={form}
				transform={transform({ y: 8 * (1 - form) })}
			>
				<rect
					x="40"
					y="26"
					width="290"
					height="250"
					rx="7"
					fill={p.card}
					stroke={p.line}
				/>
				<text
					x="58"
					y="54"
					fontSize="14"
					fontWeight="600"
					fill={p.ink}
				>
					{t("components.whatsNew.scene.interval.createMonitor")}
				</text>
				<text
					x="70"
					y="88"
					fontSize="11.5"
					fontWeight="500"
					fill={p.ink}
				>
					{t("pages.createMonitor.form.frequency.option.frequency.label")}
				</text>
				<rect
					x="70"
					y="96"
					width="230"
					height="34"
					rx="4"
					fill={p.card}
					stroke={time > 1.4 && time < PICK_AT ? p.primary : p.line}
				/>
				<text
					x="84"
					y={117 + selected.dy}
					fontSize="12.5"
					fill={p.ink}
					opacity={selected.opacity}
				>
					{selected.text}
				</text>
				<path
					d="M280 110l5 5 5-5"
					fill="none"
					stroke={p.text}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<foreignObject
					x="70"
					y="138"
					width="230"
					height="40"
				>
					<Typography
						fontSize={typographyLevels.xs}
						lineHeight={1.4}
						color={p.muted}
					>
						{t("pages.createMonitor.form.frequency.customHint")}
					</Typography>
				</foreignObject>
				<rect
					x="70"
					y="190"
					width="230"
					height="10"
					rx="3"
					fill={p.fill}
				/>
				<rect
					x="70"
					y="210"
					width="160"
					height="10"
					rx="3"
					fill={p.fill}
				/>
			</g>
			<g
				opacity={day}
				transform={transform({ y: 8 * (1 - day) })}
			>
				<rect
					x="350"
					y="26"
					width="262"
					height="250"
					rx="7"
					fill={p.card}
					stroke={p.line}
				/>
				<text
					x="368"
					y="54"
					fontSize="14"
					fontWeight="600"
					fill={p.ink}
				>
					{t("components.whatsNew.scene.interval.checksInADay")}
				</text>
				<text
					x="368"
					y={74 + count.dy}
					fontSize="11.5"
					fill={p.text}
					opacity={count.opacity}
				>
					{count.text}
				</text>
				<line
					x1={TIMELINE_X}
					y1={TIMELINE_Y}
					x2={TIMELINE_X + TIMELINE_W}
					y2={TIMELINE_Y}
					stroke={p.line}
					strokeWidth="1.5"
				/>
				{/* Dense 1-minute checks collapse, then the four 6-hour checks pop in */}
				{Array.from({ length: TICKS }, (_, i) => {
					const x = TIMELINE_X + i * ((TIMELINE_W + 0.5) / TICKS);
					const gone = lerp(time, 3.55 + i * 0.006, 3.85 + i * 0.006, 0, 1, Ease.smooth);
					return (
						<line
							key={i}
							x1={x}
							y1={TIMELINE_Y - 7}
							x2={x}
							y2={TIMELINE_Y + 7}
							stroke={p.primaryTint}
							opacity={(0.25 + 0.5 * spring(time, 0.4 + i * 0.004, SMOOTH)) * (1 - gone)}
							transform={transform({ sy: 1 - gone, oy: TIMELINE_Y })}
						/>
					);
				})}
				{[0, 1, 2, 3].map((i) => {
					const pop = spring(time, 4.35 + i * 0.22, BOUNCY);
					const cx = TIMELINE_X + i * (TIMELINE_W / 4);
					return (
						<circle
							key={i}
							cx={cx}
							cy={TIMELINE_Y}
							r="7"
							fill={p.primary}
							stroke={p.card}
							strokeWidth="2"
							opacity={clamp(pop * 3, 0, 1)}
							transform={transform({ s: pop, ox: cx, oy: TIMELINE_Y })}
						/>
					);
				})}
				<circle
					cx={TIMELINE_X + TIMELINE_W}
					cy={TIMELINE_Y}
					r="6"
					fill={p.card}
					stroke={p.primary}
					strokeWidth="1.6"
					strokeDasharray="3 2.5"
					opacity={nextDot}
					transform={transform({
						s: 0.6 + 0.4 * nextDot,
						ox: TIMELINE_X + TIMELINE_W,
						oy: TIMELINE_Y,
					})}
				/>
				{HOUR_LABELS.map((hour, i) => (
					<text
						key={hour}
						x={TIMELINE_X + i * (TIMELINE_W / 4)}
						y="180"
						fontSize="10"
						fill={p.muted}
						textAnchor="middle"
					>
						{hour}
					</text>
				))}
				<g
					opacity={next}
					transform={transform({ y: 6 * (1 - next) })}
				>
					<rect
						x="368"
						y="206"
						width="226"
						height="40"
						rx="5"
						fill={p.fill}
					/>
					<text
						x="382"
						y="230"
						fontSize="12"
						fill={p.ink}
					>
						{t("components.whatsNew.scene.interval.nextCheck", {
							interval: label(PICKED_INTERVAL),
						})}
					</text>
				</g>
			</g>
			<g
				opacity={menu}
				transform={transform({
					s: 0.97 + 0.03 * menu,
					ox: MENU_X + 115,
					oy: MENU_Y + 26,
				})}
			>
				<rect
					x={MENU_X}
					y={MENU_Y + 26}
					width="230"
					height={MENU_OPTIONS.length * ROW + 8}
					rx="4"
					fill={p.card}
					stroke={p.line}
					filter={SHADOW}
				/>
				<rect
					x={MENU_X + 4}
					y={highlightY}
					width="222"
					height={ROW - 2}
					rx="3"
					fill={p.primarySoft}
					opacity={time > 1.85 ? 1 : 0}
				/>
				{MENU_OPTIONS.map((interval, i) => (
					<text
						key={interval}
						x={MENU_X + 14}
						y={MENU_Y + 47 + i * ROW}
						fontSize="12.5"
						fill={p.ink}
						opacity={lerp(time, 1.5 + i * 0.04, 1.75 + i * 0.04, 0, 1, Ease.smooth)}
					>
						{label(interval)}
					</text>
				))}
			</g>
			<Cursor
				t={time}
				keys={CURSOR_KEYS}
				showAt={0.7}
				hideAt={3.8}
				presses={[1.4, 3.15]}
			/>
		</SceneSvg>
	);
};

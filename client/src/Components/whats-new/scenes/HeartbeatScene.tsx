import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Ease,
	clamp,
	lerp,
	pulse,
	spring,
	swap,
	transform,
	BOUNCY,
	SMOOTH,
	SNAPPY,
} from "@/Components/whats-new/motion";
import { SceneSvg } from "@/Components/whats-new/scenes/SceneParts";
import {
	SHADOW,
	useMeasureText,
	useScenePalette,
} from "@/Components/whats-new/scenes/sceneTheme";
import { formatDuration } from "@/Utils/TimeUtils";
import { useFormatDate } from "@/Hooks/useFormatDate";

// A cron job pings a heartbeat monitor; one run is missed and the alert window runs out
export const HEARTBEAT_SCENE_DURATION = 9.2;

const DAY_MS = 24 * 60 * 60 * 1000;
// Noon UTC on Monday 9 November 2026, so the markers read Monday to Friday in every time zone
const FIRST_RUN_UTC = Date.UTC(2026, 10, 9, 12);
const RUNS = [
	{ at: 1.0, ok: true },
	{ at: 2.25, ok: true },
	{ at: 3.5, ok: true },
	{ at: 4.75, ok: false },
	{ at: 7.1, ok: true },
] as const;
const MARKER = 24;
const MARKER_GAP = 24;
const MARKER_X = 356;
const MARKER_Y = 102;
const markerX = (i: number) => MARKER_X + i * (MARKER + MARKER_GAP);
const LOG_Y = 158;
const LOG_STEP = 21;
// Status pill and notification are sized to their (translated) text
const PILL_RIGHT = 598;
const PILL_TEXT_X = 20;
const PILL_PADDING = 10;
const TOAST_X = 356;
const TOAST_MIN_W = 232;
const TOAST_RIGHT_LIMIT = 588;
const TOAST_TEXT_X = 38;
const TOAST_PADDING = 14;
// Cron output is the same in every language, so the log uses dates
const logDate = (i: number) => `2026-11-${String(9 + i).padStart(2, "0")} 02:00`;
const PACKET_TIME = 0.7;
const MISS_DELAY = 1.35;

export const HeartbeatScene = ({ time }: { time: number }) => {
	const { t, i18n } = useTranslation();
	const p = useScenePalette();
	const measure = useMeasureText();
	const locale = i18n.resolvedLanguage;

	const formatDate = useFormatDate();
	const days = RUNS.map((_, i) => formatDate(FIRST_RUN_UTC + i * DAY_MS, "weekday"));
	const { yesterday, now } = useMemo(() => {
		const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
		return { yesterday: relative.format(-1, "day"), now: relative.format(0, "second") };
	}, [locale]);

	const term = spring(time, 0, SMOOTH);
	const panel = spring(time, 0.1, SMOOTH);
	const arrivals = RUNS.map((run) =>
		run.ok ? run.at + 0.15 + PACKET_TIME : run.at + MISS_DELAY
	);
	const miss = RUNS[3].at;
	const downAt = miss + MISS_DELAY;
	const backAt = arrivals[4];
	const down = time >= downAt + 0.14 && time < backAt + 0.14;
	const upLabel = t("pages.checks.selects.status.up");
	const downLabel = t("pages.checks.selects.status.down");
	const pillText = down ? downLabel : upLabel;
	const pillWidth = PILL_TEXT_X + measure(pillText, 11, 500) + PILL_PADDING;
	const pill = { x: PILL_RIGHT - pillWidth, width: pillWidth };
	const toastTitle = t("components.whatsNew.scene.heartbeat.downTitle", {
		name: t("components.whatsNew.scene.heartbeat.monitorName"),
	});
	const toastBody = t("components.whatsNew.scene.heartbeat.pingNotReceived");
	const toastWidth = Math.max(
		TOAST_MIN_W,
		TOAST_TEXT_X +
			Math.max(measure(toastTitle, 12, 600), measure(toastBody, 11)) +
			TOAST_PADDING
	);
	const toastShift = Math.min(TOAST_X, TOAST_RIGHT_LIMIT - toastWidth) - TOAST_X;

	const firstPing = arrivals[0];
	const lastCheck =
		time < miss + 0.4
			? swap(time, firstPing, yesterday, now)
			: time < backAt
				? swap(time, miss + 0.4, now, yesterday)
				: swap(time, backAt, yesterday, now);
	const status =
		time < backAt
			? swap(time, downAt, upLabel, downLabel)
			: swap(time, backAt, downLabel, upLabel);

	const waitCircumference = 2 * Math.PI * 11;
	const waitProgress = lerp(time, miss + 0.1, downAt, 0, 1, Ease.linear);
	const toast = spring(time, downAt + 0.15, SNAPPY) - spring(time, backAt + 0.1, SNAPPY);

	// The ping packet rises into its marker from below, clear of the text above the markers
	const packetRun = RUNS.findIndex(
		(run, i) => run.ok && time >= run.at + 0.15 && time <= arrivals[i]
	);
	let packet: [number, number] | null = null;
	if (packetRun >= 0) {
		const start = RUNS[packetRun].at + 0.15;
		const progress = Ease.inOut((time - start) / PACKET_TIME);
		const x0 = 296;
		const y0 = LOG_Y + packetRun * LOG_STEP - 4;
		const x1 = markerX(packetRun) + MARKER / 2;
		const y1 = MARKER_Y + MARKER / 2;
		const cx = x1 - 34;
		const cy = y1 + 62;
		const inv = 1 - progress;
		packet = [
			inv * inv * x0 + 2 * inv * progress * cx + progress * progress * x1,
			inv * inv * y0 + 2 * inv * progress * cy + progress * progress * y1,
		];
	}

	return (
		<SceneSvg
			t={time}
			duration={HEARTBEAT_SCENE_DURATION}
		>
			<g
				opacity={term}
				transform={transform({ y: 8 * (1 - term) })}
			>
				<rect
					x="26"
					y="36"
					width="296"
					height="232"
					rx="7"
					fill={p.terminal}
				/>
				{[44, 56, 68].map((cx) => (
					<circle
						key={cx}
						cx={cx}
						cy="54"
						r="3.5"
						fill={p.terminalMuted}
						opacity="0.4"
					/>
				))}
				<text
					x="84"
					y="58"
					fontSize="11"
					fill={p.terminalMuted}
				>
					backup-server
				</text>
				<g
					fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
					fontSize="11"
				>
					<text
						x="42"
						y="86"
						fill={p.terminalAccent}
					>
						$ crontab -l
					</text>
					<text
						x="42"
						y="104"
						fill={p.terminalText}
					>
						{"0 2 * * * /opt/backup.sh && \\"}
					</text>
					<text
						x="42"
						y="120"
						fill={p.terminalText}
					>
						{"curl -fsS .../<pingKey>/nightly-backup"}
					</text>
					<line
						x1="42"
						y1="136"
						x2="306"
						y2="136"
						stroke={p.terminalMuted}
						opacity="0.4"
					/>
					{RUNS.map((run, i) => {
						const shown = spring(time, run.at, SMOOTH);
						return (
							<g
								key={i}
								opacity={run.ok ? shown : shown * 0.5}
								transform={transform({ y: 6 * (1 - shown) })}
							>
								<text
									x="42"
									y={LOG_Y + i * LOG_STEP}
									fill={p.terminalMuted}
								>
									{logDate(i)}
								</text>
								{run.ok && (
									<text
										x="160"
										y={LOG_Y + i * LOG_STEP}
										fill={p.terminalText}
									>
										backup.sh: exit 0
									</text>
								)}
							</g>
						);
					})}
				</g>
			</g>
			<g
				opacity={panel}
				transform={transform({ y: 8 * (1 - panel) })}
			>
				<rect
					x="338"
					y="36"
					width="276"
					height="232"
					rx="7"
					fill={p.card}
					stroke={down ? p.down : p.line}
					strokeOpacity={down ? 0.5 : 1}
				/>
				<text
					x="356"
					y="64"
					fontSize="14"
					fontWeight="600"
					fill={p.ink}
				>
					{t("components.whatsNew.scene.heartbeat.monitorName")}
				</text>
				<text
					x="356"
					y="82"
					fontSize="11"
					fill={p.text}
				>
					{t("components.whatsNew.scene.heartbeat.subtitle", {
						type: t("pages.common.monitors.monitorTypes.optionHeartbeat"),
						window: formatDuration(DAY_MS, { long: true, locale }),
					})}
				</text>
				<rect
					x={pill.x}
					y="50"
					width={pill.width}
					height="22"
					rx="4"
					fill={down ? p.downSoft : p.upSoft}
				/>
				<circle
					cx={pill.x + 12}
					cy="61"
					r="3"
					fill={down ? p.down : p.up}
				/>
				<text
					x={pill.x + 20}
					y={65 + status.dy}
					fontSize="11"
					fontWeight="500"
					fill={down ? p.down : p.up}
					opacity={status.opacity}
				>
					{status.text}
				</text>
				{RUNS.map((run, i) => {
					const x = markerX(i);
					const landed = spring(time, arrivals[i], BOUNCY);
					return (
						<g key={i}>
							<rect
								x={x}
								y={MARKER_Y}
								width={MARKER}
								height={MARKER}
								rx="4"
								fill={p.card}
								stroke={p.line}
								strokeDasharray="3 2"
							/>
							<g
								opacity={clamp(landed * 2, 0, 1)}
								transform={transform({
									s: 0.6 + 0.4 * landed,
									ox: x + MARKER / 2,
									oy: MARKER_Y + MARKER / 2,
								})}
							>
								<rect
									x={x}
									y={MARKER_Y}
									width={MARKER}
									height={MARKER}
									rx="4"
									fill={run.ok ? p.up : p.down}
								/>
								<path
									d={
										run.ok
											? `M${x + 7} ${MARKER_Y + 12.5} l3.5 3.5 l6.5-7`
											: `M${x + 8} ${MARKER_Y + 8} l8 8 M${x + 16} ${MARKER_Y + 8} l-8 8`
									}
									fill="none"
									stroke={p.card}
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</g>
							<text
								x={x + MARKER / 2}
								y={MARKER_Y + MARKER + 16}
								fontSize="10"
								fill={p.muted}
								textAnchor="middle"
							>
								{days[i]}
							</text>
						</g>
					);
				})}
				<line
					x1="356"
					y1="172.5"
					x2="598"
					y2="172.5"
					stroke={p.line}
				/>
				<text
					x="356"
					y="206"
					fontSize="11"
					fill={p.muted}
				>
					{t("pages.common.monitors.statBoxes.lastCheck")}
				</text>
				<text
					x="356"
					y={224 + lastCheck.dy}
					fontSize="12.5"
					fontWeight="500"
					fill={p.ink}
					opacity={lastCheck.opacity}
				>
					{lastCheck.text}
				</text>
				<g opacity={pulse(time, miss + 0.1, downAt, SMOOTH)}>
					<circle
						cx="588"
						cy="214"
						r="11"
						fill="none"
						stroke={p.fill}
						strokeWidth="3"
					/>
					<circle
						cx="588"
						cy="214"
						r="11"
						fill="none"
						stroke={p.warning}
						strokeWidth="3"
						transform="rotate(-90 588 214)"
						strokeDasharray={waitCircumference}
						strokeDashoffset={waitCircumference * (1 - waitProgress)}
					/>
					<text
						x="570"
						y="218"
						fontSize="10.5"
						fill={p.warning}
						textAnchor="end"
					>
						{t("pages.createMonitor.form.frequency.heartbeat.title")}
					</text>
				</g>
			</g>
			{packet && (
				<g>
					<circle
						cx={packet[0]}
						cy={packet[1]}
						r="10"
						fill={p.up}
						opacity="0.22"
					/>
					<circle
						cx={packet[0]}
						cy={packet[1]}
						r="5"
						fill={p.up}
					/>
				</g>
			)}
			<g
				opacity={toast}
				transform={transform({ x: toastShift, y: -16 * (1 - toast) })}
			>
				<rect
					x="356"
					y="6"
					width={toastWidth}
					height="44"
					rx="4"
					fill={p.card}
					stroke={p.down}
					strokeOpacity="0.5"
					filter={SHADOW}
				/>
				<path
					d="M372 31.5h12l-1.6-2.2v-4.3a4.4 4.4 0 0 0-8.8 0v4.3z M376.4 33.5a1.7 1.7 0 0 0 3.2 0"
					fill="none"
					stroke={p.down}
					strokeWidth="1.4"
					strokeLinejoin="round"
				/>
				<text
					x="394"
					y="25"
					fontSize="12"
					fontWeight="600"
					fill={p.ink}
				>
					{toastTitle}
				</text>
				<text
					x="394"
					y="41"
					fontSize="11"
					fill={p.text}
				>
					{toastBody}
				</text>
			</g>
		</SceneSvg>
	);
};

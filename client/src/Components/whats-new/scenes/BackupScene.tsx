import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
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
	type CursorKey,
} from "@/Components/whats-new/motion";
import { CheckBadge, Cursor, SceneSvg } from "@/Components/whats-new/scenes/SceneParts";
import {
	useMeasureText,
	useScenePalette,
} from "@/Components/whats-new/scenes/sceneTheme";
import { formatDuration } from "@/Utils/TimeUtils";
import { useFormatDate } from "@/Hooks/useFormatDate";

// Mirrors Settings > Checkmate Connect: back up now, real progress steps, restore list, schedule
export const BACKUP_SCENE_DURATION = 9.2;

const HOUR_MS = 60 * 60 * 1000;
const SCHEDULE_HOURS = 72;
const MB = 1_000_000;
const BACKUP_KEY = "pages.settings.form.connect.backup";
// The backup the scene creates, then two existing ones
const BACKUPS = [
	{ at: Date.UTC(2026, 10, 14, 10, 42), kind: "full", size: 48 * MB },
	{ at: Date.UTC(2026, 10, 11, 2, 0), kind: "full", size: 47 * MB },
	{ at: Date.UTC(2026, 10, 8, 2, 0), kind: "config", size: 1 * MB },
] as const;
const ROW_Y = 194;
const ROW_H = 28;
const BAR_W = 362;
// Progress timeline: dumping, uploading, saving, completed
const T_DUMP = 1.6;
const T_UPLOAD = 3.0;
const T_SAVE = 4.5;
const T_DONE = 5.3;
// Boxes around translated text are sized from it, so longer languages don't overflow
const BUTTON_PADDING = 28;
const BUTTON_GAP = 8;
const CHIP_PADDING = 16;
const COLUMN_GAP = 12;
const RESTORE_RIGHT = 396;
const SELECT_PADDING = 26;
const SCHEDULE_RIGHT = 630;
const SCHEDULE_MIN_W = 182;
const SCHEDULE_INSET = 12;
const SWITCH_W = 30;
// Cursor path: Back up now, then the schedule switch
const cursorKeys = (backUpX: number, switchX: number) =>
	[
		[0.7, 620, 300],
		[1.25, backUpX, 98],
		[1.7, backUpX, 98],
		[2.3, 640, 320],
		[5.9, 640, 320],
		[6.5, switchX, 218],
		[7.1, switchX, 218],
		[7.6, 640, 320],
	] as const satisfies readonly CursorKey[];

export const BackupScene = ({ time }: { time: number }) => {
	const { t, i18n } = useTranslation();
	const p = useScenePalette();
	const locale = i18n.resolvedLanguage;

	const formatDate = useFormatDate();
	const dates = BACKUPS.map((backup) => formatDate(backup.at, "dateTimeShort"));
	const sizes = BACKUPS.map((backup) => prettyBytes(backup.size, { locale }));
	const measure = useMeasureText();
	const labels = {
		runFull: t(`${BACKUP_KEY}.runFull`),
		runConfig: t(`${BACKUP_KEY}.runConfig`),
		restore: t(`${BACKUP_KEY}.restore.button`),
		scheduleTitle: t("pages.settings.form.connect.schedule.title"),
		intervalLabel: t("pages.settings.form.connect.schedule.interval"),
		kindLabel: t("pages.settings.form.connect.schedule.kind"),
		interval: formatDuration(SCHEDULE_HOURS * HOUR_MS, { long: true, locale }),
		kindFull: t(`${BACKUP_KEY}.kind.full`),
	};
	const kinds = BACKUPS.map((backup) => t(`${BACKUP_KEY}.kind.${backup.kind}`));
	// Action buttons
	const fullW = measure(labels.runFull, 12, 500) + BUTTON_PADDING;
	const configX = 40 + fullW + BUTTON_GAP;
	const configW = measure(labels.runConfig, 12, 500) + BUTTON_PADDING;
	// Restore rows: date, kind chip, size, then the Restore button on the right
	const chipX = 48 + Math.max(...dates.map((date) => measure(date, 11.5))) + COLUMN_GAP;
	const chipW = Math.max(...kinds.map((kind) => measure(kind, 10))) + CHIP_PADDING;
	const sizeX = chipX + chipW + COLUMN_GAP;
	const restoreW = measure(labels.restore, 10, 500) + CHIP_PADDING;
	const restoreX = RESTORE_RIGHT - restoreW;
	// Schedule card, right-aligned; the two selects decide its width
	const intervalCol = Math.max(
		measure(labels.interval, 10.5) + SELECT_PADDING,
		measure(labels.intervalLabel, 9.5)
	);
	const kindCol = Math.max(
		measure(labels.kindFull, 10) + SELECT_PADDING,
		measure(labels.kindLabel, 9.5)
	);
	const scheduleW = Math.max(
		SCHEDULE_MIN_W,
		SCHEDULE_INSET * 2 + intervalCol + BUTTON_GAP + kindCol,
		SCHEDULE_INSET +
			SWITCH_W +
			8 +
			measure(labels.scheduleTitle, 11.5, 500) +
			SCHEDULE_INSET
	);
	const scheduleX = SCHEDULE_RIGHT - scheduleW;
	const switchX = scheduleX + SCHEDULE_INSET;
	const kindX = switchX + intervalCol + BUTTON_GAP;
	const keys = cursorKeys(40 + fullW / 2, switchX + 15);

	const steps = [
		t(`${BACKUP_KEY}.progress.backup.dumping`),
		t(`${BACKUP_KEY}.progress.backup.uploading`),
		t(`${BACKUP_KEY}.progress.backup.saving`),
	];
	const percent = Math.round(lerp(time, T_UPLOAD, T_SAVE - 0.1, 0, 100, Ease.inOut));
	const withPercent = (value: number) =>
		t(`${BACKUP_KEY}.progressWithPercent`, { step: steps[1], percent: value });
	const status =
		time < T_UPLOAD
			? swap(time, T_DUMP, t(`${BACKUP_KEY}.progress.idle`), steps[0])
			: time < T_SAVE
				? swap(time, T_UPLOAD, steps[0], withPercent(percent))
				: time < T_DONE
					? swap(time, T_SAVE, withPercent(100), steps[2])
					: swap(time, T_DONE, steps[2], t(`${BACKUP_KEY}.progress.finished.backup.ok`));
	const done = time >= T_DONE + 0.14;
	const progress =
		time < T_UPLOAD
			? lerp(time, T_DUMP, T_UPLOAD, 0, 0.33, Ease.smooth)
			: time < T_SAVE
				? lerp(time, T_UPLOAD, T_SAVE, 0.33, 0.85, Ease.inOut)
				: lerp(time, T_SAVE, T_DONE, 0.85, 1, Ease.smooth);

	const panel = spring(time, 0, SMOOTH);
	const press = pulse(time, 1.4, 1.54);
	// The file appears at the database, locks, then travels to the cloud
	const fileIn = spring(time, 1.8, BOUNCY);
	const travel = Ease.inOut(clamp((time - T_UPLOAD - 0.05) / 1.35, 0, 1));
	const inv = 1 - travel;
	const fileX = inv * inv * 480 + 2 * inv * travel * 535 + travel * travel * 590;
	const fileY = inv * inv * 112 + 2 * inv * travel * 40 + travel * travel * 108;
	const absorb = spring(time, T_SAVE - 0.05, SNAPPY);
	const fileLock = spring(time, 2.35, BOUNCY);
	const fileShackle = -3 * (1 - spring(time, 2.6, BOUNCY));
	// The new backup slides in at the top of the restore list
	const inserted = spring(time, T_DONE + 0.35, SNAPPY);
	const flash = pulse(time, T_DONE + 0.35, T_DONE + 1.4, SMOOTH);
	// Scheduled backups: the switch turns on, the box grows and its two selects appear
	const schedule = spring(time, 6.0, SMOOTH);
	const switchOn = spring(time, 6.7, SNAPPY);
	const grow = spring(time, 6.75, SNAPPY);
	const options = spring(time, 6.8, SMOOTH);

	return (
		<SceneSvg
			t={time}
			duration={BACKUP_SCENE_DURATION}
		>
			<g
				opacity={panel}
				transform={transform({ y: 8 * (1 - panel) })}
			>
				<rect
					x="22"
					y="20"
					width="398"
					height="262"
					rx="7"
					fill={p.card}
					stroke={p.line}
				/>
				<text
					x="40"
					y="48"
					fontSize="14"
					fontWeight="600"
					fill={p.ink}
				>
					{t(`${BACKUP_KEY}.title`)}
				</text>
				<text
					x="40"
					y="66"
					fontSize="11"
					fill={p.text}
				>
					{t("components.whatsNew.scene.backup.encrypted")}
				</text>
				<g transform={transform({ s: 1 - 0.03 * press, ox: 40 + fullW / 2, oy: 95 })}>
					<rect
						x="40"
						y="80"
						width={fullW}
						height="30"
						rx="4"
						fill={p.primary}
					/>
					<text
						x={40 + fullW / 2}
						y="99"
						fontSize="12"
						fontWeight="500"
						fill={p.onPrimary}
						textAnchor="middle"
					>
						{labels.runFull}
					</text>
				</g>
				<rect
					x={configX}
					y="80"
					width={configW}
					height="30"
					rx="4"
					fill={p.card}
					stroke={p.line}
				/>
				<text
					x={configX + configW / 2}
					y="99"
					fontSize="12"
					fontWeight="500"
					fill={p.ink}
					textAnchor="middle"
				>
					{labels.runConfig}
				</text>
				<g opacity={Ease.smooth(clamp((time - T_DONE - 0.1) / 0.5, 0, 1))}>
					<circle
						cx="46"
						cy="135"
						r="6"
						fill={p.up}
					/>
					<path
						d="M43.4 135 l1.9 1.9 l3.6-3.9"
						fill="none"
						stroke={p.card}
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</g>
				<text
					x={done ? 58 : 40}
					y={139 + status.dy}
					fontSize="11.5"
					fill={done ? p.up : p.ink}
					opacity={status.opacity}
				>
					{status.text}
				</text>
				<rect
					x="40"
					y="149"
					width={BAR_W}
					height="5"
					rx="2.5"
					fill={p.fill}
				/>
				<rect
					x="40"
					y="149"
					width={BAR_W * progress}
					height="5"
					rx="2.5"
					fill={p.primary}
				/>
				<text
					x="40"
					y="184"
					fontSize="11"
					fontWeight="500"
					fill={p.ink}
				>
					{t(`${BACKUP_KEY}.restore.title`)}
				</text>
				<line
					x1="40"
					y1="192"
					x2="402"
					y2="192"
					stroke={p.line}
				/>
				{BACKUPS.map((backup, i) => {
					const isNew = i === 0;
					const y = ROW_Y + i * ROW_H;
					return (
						<g
							key={backup.at}
							opacity={isNew ? inserted : 1}
							transform={transform({
								y: isNew ? -10 * (1 - inserted) : -ROW_H * (1 - inserted),
							})}
						>
							{isNew && (
								<rect
									x="40"
									y={y}
									width={BAR_W}
									height="26"
									rx="3"
									fill={p.primarySoft}
									opacity={flash}
								/>
							)}
							<text
								x="48"
								y={y + 17}
								fontSize="11.5"
								fill={p.ink}
							>
								{dates[i]}
							</text>
							<rect
								x={chipX}
								y={y + 6}
								width={chipW}
								height="16"
								rx="4"
								fill={p.fill}
							/>
							<text
								x={chipX + chipW / 2}
								y={y + 17}
								fontSize="10"
								fill={p.text}
								textAnchor="middle"
							>
								{kinds[i]}
							</text>
							<text
								x={sizeX}
								y={y + 17}
								fontSize="11"
								fill={p.muted}
							>
								{sizes[i]}
							</text>
							<rect
								x={restoreX}
								y={y + 5}
								width={restoreW}
								height="18"
								rx="4"
								fill={p.card}
								stroke={p.line}
							/>
							<text
								x={restoreX + restoreW / 2}
								y={y + 17.5}
								fontSize="10"
								fontWeight="500"
								fill={p.ink}
								textAnchor="middle"
							>
								{labels.restore}
							</text>
						</g>
					);
				})}
			</g>
			<g opacity={spring(time, 0.2, SMOOTH)}>
				<ellipse
					cx="480"
					cy="86"
					rx="28"
					ry="8"
					fill={p.card}
					stroke={p.line}
				/>
				<path
					d="M452 86v46c0 4.4 12.5 8 28 8s28-3.6 28-8V86"
					fill={p.card}
					stroke={p.line}
				/>
				<path
					d="M452 108c0 4.4 12.5 8 28 8s28-3.6 28-8"
					fill="none"
					stroke={p.line}
				/>
				<text
					x="480"
					y="160"
					fontSize="11"
					fill={p.text}
					textAnchor="middle"
				>
					{t("components.whatsNew.scene.backup.database")}
				</text>
			</g>
			<g opacity={spring(time, 0.3, SMOOTH)}>
				<path
					d="M562 128a20 20 0 0 1 4-39 28 28 0 0 1 53 8 16 16 0 0 1-3 31z"
					fill={p.primarySoft}
					stroke={p.primaryTint}
					strokeWidth="1.5"
				/>
				<text
					x="590"
					y="148"
					fontSize="11"
					fill={p.primary}
					textAnchor="middle"
				>
					{t("components.whatsNew.scene.backup.connect")}
				</text>
			</g>
			<CheckBadge
				t={time}
				at={T_DONE + 0.2}
				cx={590}
				cy={110}
				r={10}
			/>
			<g
				opacity={Math.min(fileIn, 1 - absorb)}
				transform={transform({
					x: fileX,
					y: fileY,
					s: (0.5 + 0.5 * fileIn) * (1 - 0.4 * absorb),
				})}
			>
				<rect
					x="-13"
					y="-16"
					width="26"
					height="32"
					rx="3"
					fill={p.card}
					stroke={p.primary}
					strokeWidth="1.5"
				/>
				<path
					d="M-7 -6h14M-7 0h14M-7 6h9"
					stroke={p.primaryTint}
					strokeWidth="1.5"
				/>
				<g opacity={fileLock}>
					<rect
						x="2"
						y="4"
						width="14"
						height="11"
						rx="2"
						fill={p.primary}
					/>
					<path
						d="M5 4v-3a4 4 0 0 1 8 0v3"
						fill="none"
						stroke={p.primary}
						strokeWidth="2"
						transform={transform({ y: fileShackle })}
					/>
				</g>
			</g>
			<g
				opacity={schedule}
				transform={transform({ y: 8 * (1 - schedule) })}
			>
				<rect
					x={scheduleX}
					y="198"
					width={scheduleW}
					height={40 + 44 * grow}
					rx="4"
					fill={p.card}
					stroke={p.line}
				/>
				<rect
					x={switchX}
					y="210"
					width={SWITCH_W}
					height="16"
					rx="8"
					fill={switchOn > 0.5 ? p.primary : p.line}
				/>
				<circle
					cx={switchX + 8 + 14 * switchOn}
					cy="218"
					r="6"
					fill={p.card}
				/>
				<text
					x={switchX + SWITCH_W + 8}
					y="222"
					fontSize="11.5"
					fontWeight="500"
					fill={p.ink}
				>
					{labels.scheduleTitle}
				</text>
				<g
					opacity={options}
					transform={transform({ y: 6 * (1 - options) })}
				>
					{[
						{
							x: switchX,
							w: intervalCol,
							label: labels.intervalLabel,
							value: labels.interval,
							size: 10.5,
						},
						{
							x: kindX,
							w: kindCol,
							label: labels.kindLabel,
							value: labels.kindFull,
							size: 10,
						},
					].map((select) => (
						<g key={select.label}>
							<text
								x={select.x}
								y="244"
								fontSize="9.5"
								fill={p.text}
							>
								{select.label}
							</text>
							<rect
								x={select.x}
								y="250"
								width={select.w}
								height="22"
								rx="4"
								fill={p.card}
								stroke={p.line}
							/>
							<text
								x={select.x + 7}
								y="264.5"
								fontSize={select.size}
								fill={p.ink}
							>
								{select.value}
							</text>
							<path
								d={`M${select.x + select.w - 13} 259l3 3 3-3`}
								fill="none"
								stroke={p.text}
								strokeWidth="1.3"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</g>
					))}
				</g>
			</g>
			<Cursor
				t={time}
				keys={keys}
				showAt={0.7}
				hideAt={7.3}
				presses={[1.4, 6.65]}
			/>
		</SceneSvg>
	);
};

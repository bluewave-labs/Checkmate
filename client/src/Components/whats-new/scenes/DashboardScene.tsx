import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	Ease,
	clamp,
	cursorPos,
	lerp,
	mix,
	pulse,
	spring,
	transform,
	SMOOTH,
	SNAPPY,
	type CursorKey,
} from "@/Components/whats-new/motion";
import { Cursor, SceneSvg } from "@/Components/whats-new/scenes/SceneParts";
import {
	SHADOW,
	useMeasureText,
	useScenePalette,
	type ScenePalette,
} from "@/Components/whats-new/scenes/sceneTheme";
import type { DashboardCardKey } from "@/Types/Dashboard";

// Mirrors Pages/Dashboard: Arrange / Edit cards header, two-column grid, Edit cards dialog
export const DASHBOARD_SCENE_DURATION = 8.6;

const CARD_W = 196;
const CARD_H = 102;
const BAR_W = CARD_W - 24;
const SLOTS = [
	[146, 58],
	[352, 58],
	[146, 170],
	[352, 170],
] as const;
const SceneCards = ["monitorStatus", "uptime", "currentlyDown", "queue"] as const;
type SceneCard = (typeof SceneCards)[number];
// Slot of each card before and after Queue is dragged to the front
const ORDER_START: Record<SceneCard, number> = {
	monitorStatus: 0,
	uptime: 1,
	currentlyDown: 2,
	queue: 3,
};
const ORDER_ARRANGED: Record<SceneCard, number> = {
	queue: 0,
	monitorStatus: 1,
	uptime: 2,
	currentlyDown: 3,
};
// Edit cards lists every card alphabetically; these are the ones checked in the scene
const DIALOG_CARDS: readonly [DashboardCardKey, boolean][] = [
	["diagnostic", false],
	["currentlyDown", true],
	["monitorStatus", true],
	["uptime", true],
	["monitorsByType", false],
	["queue", true],
];
// Header buttons sit right-aligned and are sized to their (translated) labels
const HEADER_RIGHT = 546;
const HEADER_GAP = 6;
const BUTTON_PADDING = 16;
const DIALOG_DONE_RIGHT = 398;
// Cursor path; the stops on buttons follow wherever those buttons end up
const cursorKeys = (
	arrangeX: number,
	doneX: number,
	editCardsX: number,
	dialogDoneX: number
) =>
	[
		[1.7, 610, 300],
		[2.2, arrangeX, 37],
		[2.45, arrangeX, 37],
		[2.95, 450, 221],
		[3.1, 450, 221],
		[3.85, 244, 109],
		[4.15, 244, 109],
		[4.45, doneX, 37],
		[4.7, doneX, 37],
		[4.95, editCardsX, 37],
		[5.2, editCardsX, 37],
		[5.6, 249, 164],
		[5.85, 249, 164],
		[6.1, dialogDoneX, 238],
		[6.3, dialogDoneX, 238],
		[6.9, 640, 320],
	] as const satisfies readonly CursorKey[];
const PRESSES = [2.35, 3.05, 4.6, 5.1, 5.75, 6.2] as const;
const DRAG_START = 3.05;
const DRAG_END = 4.15;

interface HeaderButtonProps {
	p: ScenePalette;
	x: number;
	width: number;
	label: string;
	primary?: boolean;
}

const HeaderButton = ({ p, x, width, label, primary = false }: HeaderButtonProps) => (
	<g>
		<rect
			x={x}
			y="27"
			width={width}
			height="20"
			rx="4"
			fill={primary ? p.primary : p.card}
			stroke={primary ? p.primary : p.line}
		/>
		<text
			x={x + width / 2}
			y="40.5"
			fontSize="10"
			fontWeight="500"
			fill={primary ? p.onPrimary : p.ink}
			textAnchor="middle"
		>
			{label}
		</text>
	</g>
);

interface BarRowProps {
	p: ScenePalette;
	y: number;
	label: string;
	value: string;
	color: string;
	ratio: number;
}

const BarRow = ({ p, y, label, value, color, ratio }: BarRowProps) => (
	<g>
		<text
			x="12"
			y={y}
			fontSize="10.5"
			fill={p.ink}
		>
			{label}
		</text>
		<text
			x={CARD_W - 12}
			y={y}
			fontSize="10.5"
			fontWeight="500"
			fill={color}
			textAnchor="end"
		>
			{value}
		</text>
		<rect
			x="12"
			y={y + 8}
			width={BAR_W}
			height="4"
			rx="2"
			fill={p.fill}
		/>
		<rect
			x="12"
			y={y + 8}
			width={BAR_W * ratio}
			height="4"
			rx="2"
			fill={p.primary}
		/>
	</g>
);

export const DashboardScene = ({ time }: { time: number }) => {
	const { t } = useTranslation();
	const p = useScenePalette();
	const measure = useMeasureText();
	const buttonWidth = (label: string) =>
		Math.round(measure(label, 10, 500)) + BUTTON_PADDING;
	const labels = {
		arrange: t("pages.dashboard.arrange.start"),
		editCards: t("pages.dashboard.editCards"),
		reset: t("pages.dashboard.arrange.reset"),
		done: t("pages.dashboard.arrange.done"),
		dialogDone: t("pages.dashboard.editCardsModal.done"),
	};
	// Right-aligned header: [Arrange][Edit cards], and while arranging [Reset order][Done]
	const editCardsW = buttonWidth(labels.editCards);
	const editCardsX = HEADER_RIGHT - editCardsW;
	const arrangeW = buttonWidth(labels.arrange);
	const arrangeX = editCardsX - HEADER_GAP - arrangeW;
	const doneW = buttonWidth(labels.done);
	const doneX = HEADER_RIGHT - doneW;
	const resetW = buttonWidth(labels.reset);
	const resetX = doneX - HEADER_GAP - resetW;
	const dialogDoneW = buttonWidth(labels.dialogDone);
	const dialogDoneX = DIALOG_DONE_RIGHT - dialogDoneW;
	const keys = cursorKeys(
		arrangeX + arrangeW / 2,
		doneX + doneW / 2,
		editCardsX + editCardsW / 2,
		dialogDoneX + dialogDoneW / 2
	);

	// Arrange mode: the header swaps buttons (out, then in) and every card gets the drag overlay
	const arranging = spring(time, 2.45, SNAPPY) - spring(time, 4.6, SNAPPY);
	const hide = spring(time, 6.25, SNAPPY);
	const reflow = spring(time, 6.4, SNAPPY);
	const arranged = spring(time, 3.45, SNAPPY);
	const fill = Ease.smooth(clamp((time - 0.55) / 1.1, 0, 1));
	const upCount = Math.round(23 * fill);
	const lift = pulse(time, DRAG_START, 3.95, SNAPPY);
	const dragging = time > DRAG_START && time < DRAG_END;
	const dialogOpen = lerp(time, 5.1, 5.35, 0, 1, Ease.smooth);
	const dialogClose = lerp(time, 6.2, 6.35, 0, 1, Ease.smooth);
	const dialog = dialogOpen * (1 - dialogClose);
	const uptimeChecked = 1 - lerp(time, 5.75, 5.9, 0, 1, Ease.smooth);

	const cardPosition = (card: SceneCard, index: number) => {
		const enter = spring(time, 0.12 + index * 0.07, SMOOTH);
		if (card === "queue") {
			if (dragging) {
				const [cx, cy] = cursorPos(time, keys);
				const settle = spring(time, 3.9, SNAPPY);
				return {
					enter,
					x: mix(cx - CARD_W / 2, SLOTS[0][0], settle),
					y: mix(cy - CARD_H / 2, SLOTS[0][1], settle),
					s: 1 + 0.035 * lift,
				};
			}
			const [x, y] = time >= DRAG_END ? SLOTS[0] : SLOTS[ORDER_START.queue];
			return { enter, x, y: y + 10 * (1 - enter), s: 1 };
		}
		const [x0, y0] = SLOTS[ORDER_START[card]];
		const [x1, y1] = SLOTS[ORDER_ARRANGED[card]];
		let x = mix(x0, x1, arranged);
		let y = mix(y0, y1, arranged);
		if (card === "currentlyDown") {
			x = mix(x, SLOTS[2][0], reflow);
			y = mix(y, SLOTS[2][1], reflow);
		}
		const gone = card === "uptime" ? hide : 0;
		return { enter: enter * (1 - gone), x, y: y + 10 * (1 - enter), s: 1 - 0.04 * gone };
	};

	const cardBody: Record<SceneCard, ReactNode> = {
		monitorStatus: (
			<g>
				<text
					x="12"
					y="58"
					fontSize="24"
					fontWeight="600"
					fill={p.ink}
				>
					{upCount}
					<tspan
						dx="6"
						fontSize="11"
						fontWeight="400"
						fill={p.text}
					>
						{t("pages.dashboard.monitorStatus.ofUp", { total: 24 })}
					</tspan>
				</text>
				<rect
					x="12"
					y="70"
					width={BAR_W}
					height="6"
					rx="3"
					fill={p.fill}
				/>
				<rect
					x="12"
					y="70"
					width={BAR_W * (23 / 24) * fill}
					height="6"
					rx="3"
					fill={p.primary}
				/>
			</g>
		),
		uptime: (
			<g>
				<path
					d="M181 12v8M178 17l3 3 3-3"
					fill="none"
					stroke={p.text}
					strokeWidth="1.2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<BarRow
					p={p}
					y={50}
					label="example.com"
					value="99.98%"
					color={p.up}
					ratio={0.9998 * fill}
				/>
				<BarRow
					p={p}
					y={82}
					label="api.example.com"
					value="97.40%"
					color={p.warning}
					ratio={0.974 * fill}
				/>
			</g>
		),
		currentlyDown: (
			<g opacity={spring(time, 0.8, SMOOTH)}>
				<text
					x={CARD_W - 12}
					y="21"
					fontSize="10.5"
					fill={p.text}
					textAnchor="end"
				>
					1
				</text>
				<circle
					cx="16"
					cy="44"
					r="3.5"
					fill={p.down}
				/>
				<text
					x="26"
					y="48"
					fontSize="11"
					fill={p.ink}
				>
					api.example.com
				</text>
			</g>
		),
		queue: (
			<g>
				<BarRow
					p={p}
					y={50}
					label={t("pages.dashboard.queue.activeJobs")}
					value="2 / 24"
					color={p.primary}
					ratio={(2 / 24) * fill}
				/>
				<BarRow
					p={p}
					y={82}
					label={t("pages.dashboard.queue.failingJobs")}
					value="0 / 24"
					color={p.primary}
					ratio={0}
				/>
			</g>
		),
	};

	const renderCard = (card: SceneCard, index: number) => {
		const { enter, x, y, s } = cardPosition(card, index);
		const isDragged = card === "queue" && dragging;
		return (
			<g
				key={card}
				opacity={enter}
				transform={transform({ x, y, s, ox: CARD_W / 2, oy: CARD_H / 2 })}
			>
				<rect
					width={CARD_W}
					height={CARD_H}
					rx="4"
					fill={p.card}
					filter={SHADOW}
					opacity={card === "queue" ? lift : 0}
				/>
				<rect
					width={CARD_W}
					height={CARD_H}
					rx="4"
					fill={p.card}
					stroke={p.line}
				/>
				<text
					x="12"
					y="21"
					fontSize="11"
					fontWeight="500"
					fill={p.ink}
				>
					{t(`pages.dashboard.cards.${card}`)}
				</text>
				{cardBody[card]}
				<rect
					x="1"
					y="1"
					width={CARD_W - 2}
					height={CARD_H - 2}
					rx="4"
					fill={p.ink}
					fillOpacity="0.04"
					stroke={isDragged ? p.primary : p.line}
					strokeWidth="2"
					opacity={arranging}
				/>
			</g>
		);
	};

	// The dragged card renders last so it stays above the others
	const drawOrder = [...SceneCards.filter((card) => card !== "queue"), "queue" as const];

	return (
		<SceneSvg
			t={time}
			duration={DASHBOARD_SCENE_DURATION}
		>
			<g opacity={lerp(time, 0, 0.35, 0, 1, Ease.smooth)}>
				<rect
					x="80"
					y="16"
					width="480"
					height="270"
					rx="7"
					fill={p.card}
					stroke={p.line}
				/>
				<path
					d="M80 23a7 7 0 0 1 7-7h43v270H87a7 7 0 0 1-7-7z"
					fill={p.surface}
				/>
				<line
					x1="130"
					y1="16"
					x2="130"
					y2="286"
					stroke={p.line}
				/>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<rect
						key={i}
						x="94"
						y={i === 0 ? 30 : 36 + i * 20}
						width="22"
						height="6"
						rx="2"
						fill={i === 1 ? p.primaryTint : p.fill}
					/>
				))}
				<text
					x="146"
					y="42"
					fontSize="14"
					fontWeight="600"
					fill={p.ink}
				>
					{t("pages.dashboard.header.title")}
				</text>
				<g opacity={clamp(1 - 2 * arranging, 0, 1)}>
					<HeaderButton
						p={p}
						x={arrangeX}
						width={arrangeW}
						label={labels.arrange}
					/>
					<HeaderButton
						p={p}
						x={editCardsX}
						width={editCardsW}
						label={labels.editCards}
					/>
				</g>
				<g opacity={clamp(2 * arranging - 1, 0, 1)}>
					<HeaderButton
						p={p}
						x={resetX}
						width={resetW}
						label={labels.reset}
					/>
					<HeaderButton
						p={p}
						x={doneX}
						width={doneW}
						label={labels.done}
						primary
					/>
				</g>
			</g>
			{drawOrder.map((card) => renderCard(card, SceneCards.indexOf(card)))}
			<g opacity={dialog}>
				<rect
					x="81"
					y="17"
					width="478"
					height="268"
					rx="6"
					fill={p.shadow}
					fillOpacity="0.28"
				/>
				<g transform={transform({ s: 0.96 + 0.04 * dialog, ox: 320, oy: 161 })}>
					<rect
						x="230"
						y="64"
						width="180"
						height="194"
						rx="4"
						fill={p.card}
						stroke={p.line}
						filter={SHADOW}
					/>
					<text
						x="244"
						y="86"
						fontSize="12"
						fontWeight="600"
						fill={p.ink}
					>
						{t("pages.dashboard.editCardsModal.title")}
					</text>
					{DIALOG_CARDS.map(([card, checked], i) => {
						const y = 98 + i * 20;
						const on = card === "uptime" ? uptimeChecked : checked ? 1 : 0;
						return (
							<g key={card}>
								<rect
									x="244"
									y={y}
									width="11"
									height="11"
									rx="2"
									fill={p.card}
									stroke={p.line}
								/>
								<g opacity={on}>
									<rect
										x="244"
										y={y}
										width="11"
										height="11"
										rx="2"
										fill={p.primary}
									/>
									<path
										d={`M246.8 ${y + 5.6} l2.1 2.1 l3.9-4.3`}
										fill="none"
										stroke={p.onPrimary}
										strokeWidth="1.4"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</g>
								<text
									x="262"
									y={y + 9.5}
									fontSize="10.5"
									fill={p.ink}
								>
									{t(`pages.dashboard.cards.${card}`)}
								</text>
							</g>
						);
					})}
					<rect
						x={dialogDoneX}
						y="228"
						width={dialogDoneW}
						height="20"
						rx="4"
						fill={p.primary}
					/>
					<text
						x={dialogDoneX + dialogDoneW / 2}
						y="241.5"
						fontSize="10"
						fontWeight="500"
						fill={p.onPrimary}
						textAnchor="middle"
					>
						{labels.dialogDone}
					</text>
				</g>
			</g>
			<Cursor
				t={time}
				keys={keys}
				showAt={1.7}
				hideAt={6.6}
				presses={PRESSES}
			/>
		</SceneSvg>
	);
};

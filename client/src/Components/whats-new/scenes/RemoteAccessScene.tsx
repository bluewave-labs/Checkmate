import { useTranslation } from "react-i18next";
import {
	Ease,
	lerp,
	mix,
	pulse,
	spring,
	transform,
	BOUNCY,
	SMOOTH,
	SNAPPY,
} from "@/Components/whats-new/motion";
import { CheckBadge, SceneSvg } from "@/Components/whats-new/scenes/SceneParts";
import {
	useMeasureText,
	useScenePalette,
} from "@/Components/whats-new/scenes/sceneTheme";

// The server keeps an outbound tunnel to Checkmate Connect; an inbound attempt is blocked
export const REMOTE_ACCESS_SCENE_DURATION = 8.8;

// Tunnel from the server (inside the network) out to the Connect cloud, as one cubic curve
const TUNNEL = [
	[180, 156],
	[260, 156],
	[300, 150],
	[404, 150],
] as const;
const TUNNEL_PATH = `M${TUNNEL[0].join(" ")} C${TUNNEL[1].join(" ")} ${TUNNEL[2].join(" ")} ${TUNNEL[3].join(" ")}`;
const tunnelPoint = (u: number): [number, number] => {
	const v = 1 - u;
	const [a, b, c, d] = TUNNEL;
	return [
		v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
		v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1],
	];
};
// The firewall sits on the network edge, with a gap where the tunnel leaves
const WALL_ROWS = [78, 96, 114, 168, 186, 204] as const;
const LAPTOP = { x: -28, y: 8 } as const;
// The tunnel label sits between the firewall and the cloud; long translations shrink to fit
const TUNNEL_LABEL_X = 300;
const TUNNEL_LABEL_MAX_W = 84;
const TUNNEL_LABEL_SIZE = 10.5;
const LAPTOP_EDGE: [number, number] = [540, 112];
const CLOUD_EDGE: [number, number] = [462, 134];

export const RemoteAccessScene = ({ time }: { time: number }) => {
	const { t } = useTranslation();
	const p = useScenePalette();
	const measure = useMeasureText();
	const tunnelLabel = t("components.whatsNew.scene.remote.tunnel");
	const tunnelLabelSize = Math.min(
		TUNNEL_LABEL_SIZE,
		(TUNNEL_LABEL_SIZE * TUNNEL_LABEL_MAX_W) / measure(tunnelLabel, TUNNEL_LABEL_SIZE)
	);

	const net = spring(time, 0, SMOOTH);
	const cloud = spring(time, 0.2, SMOOTH);
	const tunnelDrawn = lerp(time, 0.7, 1.5, 0, 1, Ease.smooth);
	const flow = lerp(time, 1.4, 1.7, 0, 0.9);
	const blocked = pulse(time, 1.9, 2.75, SNAPPY);
	const blockedSlide = 22 * (1 - spring(time, 1.9, SNAPPY));
	const hit =
		time > 2.15 && time < 2.5
			? Math.sin((time - 2.15) * 60) * 2.2 * (1 - (time - 2.15) / 0.35)
			: 0;
	const lock = spring(time, 2.25, BOUNCY);
	const shackle = -4 * (1 - spring(time, 2.55, BOUNCY));
	const laptop = spring(time, 3.0, SMOOTH);
	const address = lerp(time, 3.35, 3.9, 0, 64, Ease.linear);
	const screen = lerp(time, 5.95, 6.15, 0, 1, Ease.smooth);

	// A request goes laptop -> Connect -> tunnel -> server, and the response comes back
	let request: [number, number] | null = null;
	if (time >= 3.95 && time < 4.35) {
		const u = Ease.inOut((time - 3.95) / 0.4);
		request = [
			mix(LAPTOP_EDGE[0], CLOUD_EDGE[0], u),
			mix(LAPTOP_EDGE[1], CLOUD_EDGE[1], u),
		];
	} else if (time >= 4.35 && time < 4.95) {
		request = tunnelPoint(1 - Ease.inOut((time - 4.35) / 0.6));
	}
	let response: [number, number] | null = null;
	if (time >= 5.0 && time < 5.6) {
		response = tunnelPoint(Ease.inOut((time - 5.0) / 0.6));
	} else if (time >= 5.6 && time < 6.0) {
		const u = Ease.inOut((time - 5.6) / 0.4);
		response = [
			mix(CLOUD_EDGE[0], LAPTOP_EDGE[0], u),
			mix(CLOUD_EDGE[1], LAPTOP_EDGE[1], u),
		];
	}

	return (
		<SceneSvg
			t={time}
			duration={REMOTE_ACCESS_SCENE_DURATION}
		>
			<g
				opacity={net}
				transform={transform({ y: 8 * (1 - net) })}
			>
				<rect
					x="22"
					y="40"
					width="262"
					height="226"
					rx="12"
					fill={p.card}
					fillOpacity="0.55"
					stroke={p.line}
					strokeDasharray="5 4"
				/>
				<text
					x="38"
					y="62"
					fontSize="11"
					fill={p.text}
				>
					{t("components.whatsNew.scene.remote.network")}
				</text>
				<rect
					x="66"
					y="108"
					width="114"
					height="92"
					rx="6"
					fill={p.card}
					stroke={p.line}
				/>
				{[0, 1, 2].map((i) => (
					<g key={i}>
						<rect
							x="80"
							y={122 + i * 20}
							width="62"
							height="7"
							rx="2"
							fill={p.fill}
						/>
						<circle
							cx="164"
							cy={125.5 + i * 20}
							r="3"
							fill={p.up}
							opacity={0.55 + 0.45 * Math.abs(Math.sin(time * 2.2 + i))}
						/>
					</g>
				))}
				<text
					x="123"
					y="220"
					fontSize="11"
					fill={p.text}
					textAnchor="middle"
				>
					{t("components.whatsNew.scene.remote.server")}
				</text>
				<g transform={transform({ x: hit })}>
					{WALL_ROWS.map((y) => (
						<rect
							key={y}
							x="276"
							y={y}
							width="16"
							height="15"
							rx="1.5"
							fill={p.fill}
							stroke={p.line}
						/>
					))}
				</g>
			</g>
			<path
				d={TUNNEL_PATH}
				fill="none"
				stroke={p.primary}
				strokeWidth="3"
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray="1"
				strokeDashoffset={1 - tunnelDrawn}
			/>
			<path
				d={TUNNEL_PATH}
				fill="none"
				stroke={p.card}
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeDasharray="2 10"
				strokeDashoffset={-time * 28}
				opacity={flow}
			/>
			<text
				x={TUNNEL_LABEL_X}
				y="174"
				fontSize={tunnelLabelSize}
				fill={p.primary}
				opacity={spring(time, 1.4, SMOOTH)}
			>
				{tunnelLabel}
			</text>
			<g
				opacity={cloud}
				transform={transform({ y: 8 * (1 - cloud) })}
			>
				<path
					d="M408 178a24 24 0 0 1 5-47 34 34 0 0 1 64 9 20 20 0 0 1-4 38z"
					fill={p.primarySoft}
					stroke={p.primaryTint}
					strokeWidth="1.5"
				/>
				<text
					x="446"
					y="198"
					fontSize="11"
					fill={p.primary}
					textAnchor="middle"
				>
					{t("components.whatsNew.connectTag")}
				</text>
			</g>
			<g
				opacity={lock}
				transform={transform({ s: 0.6 + 0.4 * lock, ox: 49, oy: 245 })}
			>
				<rect
					x="40"
					y="238"
					width="18"
					height="14"
					rx="2.5"
					fill={p.ink}
				/>
				<path
					d="M43.5 238v-3.5a5.5 5.5 0 0 1 11 0v3.5"
					fill="none"
					stroke={p.ink}
					strokeWidth="2.2"
					transform={transform({ y: shackle })}
				/>
				<circle
					cx="49"
					cy="245"
					r="1.8"
					fill={p.card}
				/>
			</g>
			<text
				x="66"
				y="249"
				fontSize="10.5"
				fill={p.text}
				opacity={spring(time, 2.5, SMOOTH)}
			>
				{t("components.whatsNew.scene.remote.noInbound")}
			</text>
			<g
				opacity={blocked}
				transform={transform({ x: blockedSlide })}
				stroke={p.down}
				strokeWidth="1.6"
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path
					d="M352 104 H297"
					strokeDasharray="4 3"
				/>
				<path d="M303 98l-7 6 7 6" />
			</g>
			<g transform={transform({ x: LAPTOP.x, y: LAPTOP.y })}>
				<g
					opacity={laptop}
					transform={transform({ y: -8 * (1 - laptop) })}
				>
					<rect
						x="516"
						y="30"
						width="104"
						height="70"
						rx="5"
						fill={p.card}
						stroke={p.line}
					/>
					<path
						d="M506 104h124l-6 6H512z"
						fill={p.line}
					/>
					<rect
						x="524"
						y="38"
						width="88"
						height="12"
						rx="3"
						fill={p.fill}
					/>
					<rect
						x="530"
						y="42"
						width={address}
						height="4"
						rx="2"
						fill={p.muted}
					/>
					<g opacity={screen}>
						<rect
							x="524"
							y="56"
							width="18"
							height="38"
							rx="2"
							fill={p.fill}
						/>
						{[0, 1, 2].map((i) => (
							<rect
								key={i}
								x={548 + i * 22}
								y="58"
								width="18"
								height="16"
								rx="2"
								fill={i === 1 ? p.downSoft : p.upSoft}
								opacity={spring(time, 6.0 + i * 0.07, SMOOTH)}
							/>
						))}
						<rect
							x="548"
							y="78"
							width="62"
							height="14"
							rx="2"
							fill={p.primarySoft}
							opacity={spring(time, 6.21, SMOOTH)}
						/>
					</g>
					<text
						x="568"
						y="126"
						fontSize="11"
						fill={p.text}
						textAnchor="middle"
					>
						{t("components.whatsNew.scene.remote.laptop")}
					</text>
				</g>
				<CheckBadge
					t={time}
					at={6.45}
					cx={616}
					cy={32}
				/>
			</g>
			{request && (
				<circle
					cx={request[0]}
					cy={request[1]}
					r="4.5"
					fill={p.ink}
				/>
			)}
			{response && (
				<circle
					cx={response[0]}
					cy={response[1]}
					r="4.5"
					fill={p.up}
				/>
			)}
		</SceneSvg>
	);
};

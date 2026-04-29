import { useTheme } from "@mui/material/styles";

interface EmptyStateIllustrationProps {
	width?: number | string;
	height?: number | string;
}

const PALETTE = {
	light: {
		grid: "#CBD5E1",
		backFill: "#F5F7FA",
		backStroke: "#D5DBE3",
		backInner: "#B6C2CF",
		frontFill: "#EAF5F0",
		frontStroke: "#7DBFAA",
		frontInner: "#4DAF94",
	},
	dark: {
		grid: "#3A4452",
		backFill: "#475569",
		backStroke: "#64748B",
		backInner: "#CBD5E1",
		frontFill: "#0F5D4A",
		frontStroke: "#4DAF94",
		frontInner: "#B5E2D2",
	},
};

export const EmptyStateIllustration = ({
	width = 160,
	height = 120,
}: EmptyStateIllustrationProps) => {
	const theme = useTheme();
	const p = theme.palette.mode === "dark" ? PALETTE.dark : PALETTE.light;
	return (
		<svg
			viewBox="0 0 160 120"
			width={width}
			height={height}
			aria-hidden="true"
		>
			<g
				stroke={p.grid}
				strokeWidth="0.75"
			>
				<line
					x1="16"
					y1="0"
					x2="16"
					y2="120"
				/>
				<line
					x1="56"
					y1="0"
					x2="56"
					y2="120"
					strokeDasharray="3 3"
				/>
				<line
					x1="104"
					y1="0"
					x2="104"
					y2="120"
					strokeDasharray="3 3"
				/>
				<line
					x1="144"
					y1="0"
					x2="144"
					y2="120"
				/>
				<line
					x1="0"
					y1="12"
					x2="160"
					y2="12"
				/>
				<line
					x1="0"
					y1="44"
					x2="160"
					y2="44"
					strokeDasharray="3 3"
				/>
				<line
					x1="0"
					y1="76"
					x2="160"
					y2="76"
					strokeDasharray="3 3"
				/>
				<line
					x1="0"
					y1="108"
					x2="160"
					y2="108"
				/>
			</g>

			<g>
				<rect
					x="38"
					y="22"
					width="92"
					height="42"
					rx="6"
					fill={p.backFill}
					stroke={p.backStroke}
					strokeWidth="0.5"
				/>
				<rect
					x="48"
					y="32"
					width="14"
					height="22"
					rx="2"
					fill={p.backInner}
					opacity="0.5"
				/>
				<rect
					x="68"
					y="34"
					width="50"
					height="2.5"
					rx="1.25"
					fill={p.backInner}
					opacity="0.7"
				/>
				<rect
					x="68"
					y="42"
					width="38"
					height="2.5"
					rx="1.25"
					fill={p.backInner}
					opacity="0.55"
				/>
				<rect
					x="68"
					y="50"
					width="44"
					height="2.5"
					rx="1.25"
					fill={p.backInner}
					opacity="0.55"
				/>
				<rect
					x="22"
					y="50"
					width="92"
					height="42"
					rx="6"
					fill={p.frontFill}
					stroke={p.frontStroke}
					strokeWidth="0.5"
					strokeOpacity="0.4"
				/>
				<rect
					x="32"
					y="60"
					width="14"
					height="22"
					rx="2"
					fill={p.frontInner}
					opacity="0.35"
				/>
				<rect
					x="52"
					y="62"
					width="50"
					height="2.5"
					rx="1.25"
					fill={p.frontInner}
					opacity="0.55"
				/>
				<rect
					x="52"
					y="70"
					width="38"
					height="2.5"
					rx="1.25"
					fill={p.frontInner}
					opacity="0.4"
				/>
				<rect
					x="52"
					y="78"
					width="44"
					height="2.5"
					rx="1.25"
					fill={p.frontInner}
					opacity="0.4"
				/>
			</g>
		</svg>
	);
};

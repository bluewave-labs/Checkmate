import type { CSSProperties } from "react";

export const DotSizes = ["xs", "sm", "md", "lg"] as const;
export type DotSize = (typeof DotSizes)[number];

const DOT_SIZE_PX: Record<DotSize, string> = {
	xs: "2px",
	sm: "4px",
	md: "8px",
	lg: "12px",
};

interface DotProps {
	color?: string;
	size?: DotSize;
	style?: CSSProperties;
}

export const Dot = ({ color = "gray", size = "sm", style }: DotProps) => {
	return (
		<span
			style={{
				content: '""',
				width: DOT_SIZE_PX[size],
				height: DOT_SIZE_PX[size],
				borderRadius: "50%",
				backgroundColor: color,
				opacity: 0.8,
				...style,
			}}
		/>
	);
};

import type { CSSProperties } from "react";

interface DotProps {
	color?: string;
	size?: string;
	style?: CSSProperties;
}

export const Dot = ({ color = "gray", size = "4px", style }: DotProps) => {
	return (
		<span
			style={{
				content: '""',
				width: size,
				height: size,
				borderRadius: "50%",
				backgroundColor: color,
				opacity: 0.8,
				...style,
			}}
		/>
	);
};

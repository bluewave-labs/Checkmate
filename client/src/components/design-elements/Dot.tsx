export const Dot = ({
	color = "gray",
	size = "4px",
	style,
}: {
	color?: string;
	size?: string;
	style?: React.CSSProperties;
}) => {
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

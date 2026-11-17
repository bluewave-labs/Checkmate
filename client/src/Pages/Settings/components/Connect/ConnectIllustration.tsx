import { useTheme } from "@mui/material/styles";

// This server, an encrypted tunnel, Checkmate Connect, and the device you reach it from
export const ConnectIllustration = () => {
	const theme = useTheme();
	const accent =
		theme.palette.mode === "dark"
			? theme.palette.primary.light
			: theme.palette.primary.main;
	const border = theme.palette.neutral.border;
	const raised = theme.palette.neutral.raised;
	const paper = theme.palette.background.paper;

	return (
		<svg
			viewBox="0 0 320 110"
			width="100%"
			aria-hidden="true"
		>
			{/* This server */}
			<rect
				x="16"
				y="24"
				width="64"
				height="62"
				rx="6"
				fill={raised}
				stroke={border}
			/>
			<rect
				x="24"
				y="34"
				width="48"
				height="16"
				rx="2"
				fill={paper}
				stroke={border}
			/>
			<rect
				x="24"
				y="58"
				width="48"
				height="16"
				rx="2"
				fill={paper}
				stroke={border}
			/>
			<circle
				cx="63"
				cy="42"
				r="2.5"
				fill={accent}
			/>
			<circle
				cx="63"
				cy="66"
				r="2.5"
				fill={accent}
			/>

			{/* Encrypted outbound tunnel */}
			<line
				x1="86"
				y1="55"
				x2="134"
				y2="55"
				stroke={accent}
				strokeWidth="1.5"
				strokeDasharray="4 4"
			/>
			<circle
				cx="110"
				cy="55"
				r="10"
				fill={paper}
				stroke={accent}
				strokeWidth="1.5"
			/>
			<path
				d="M107 55 V52.5 A3 3 0 0 1 113 52.5 V55"
				fill="none"
				stroke={accent}
				strokeWidth="1.5"
			/>
			<rect
				x="105.5"
				y="55"
				width="9"
				height="6.5"
				rx="1"
				fill={accent}
			/>

			{/* Checkmate Connect */}
			<path
				d="M142 74 H184 A13 13 0 0 0 186 48.2 A19 19 0 0 0 150.6 42.4 A16 16 0 0 0 142 74 Z"
				fill={theme.palette.neutral.selectedGreen}
				stroke={accent}
				strokeWidth="1.5"
			/>
			<path
				d="M155 59 L161 65 L173 53"
				fill="none"
				stroke={accent}
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* Remote access from anywhere */}
			<line
				x1="198"
				y1="55"
				x2="244"
				y2="55"
				stroke={accent}
				strokeWidth="1.5"
				strokeDasharray="4 4"
			/>
			<rect
				x="252"
				y="32"
				width="48"
				height="32"
				rx="3"
				fill={raised}
				stroke={border}
			/>
			<rect
				x="258"
				y="39"
				width="22"
				height="4"
				rx="1"
				fill={accent}
			/>
			<rect
				x="258"
				y="48"
				width="36"
				height="3"
				rx="1"
				fill={border}
			/>
			<rect
				x="258"
				y="55"
				width="28"
				height="3"
				rx="1"
				fill={border}
			/>
			<rect
				x="244"
				y="66"
				width="64"
				height="5"
				rx="2"
				fill={border}
			/>
		</svg>
	);
};

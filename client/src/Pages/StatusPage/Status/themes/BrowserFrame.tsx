import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

interface Props {
	url: string;
	children: ReactNode;
}

export const BrowserFrame = ({ url, children }: Props) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				width: "100%",
				minHeight: "calc(100vh - 180px)",
				display: "flex",
				flexDirection: "column",
				borderRadius: "12px",
				overflow: "hidden",
				border: "1px solid var(--sp-border, " + theme.palette.divider + ")",
				background: "var(--sp-surface, " + theme.palette.background.paper + ")",
				color: "var(--sp-text, " + theme.palette.text.primary + ")",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					padding: "10px 14px",
					background:
						"var(--sp-bg, " +
						(theme.palette.mode === "dark" ? "#1a1a1a" : "#f1f2f4") +
						")",
					borderBottom: "1px solid var(--sp-border, " + theme.palette.divider + ")",
				}}
			>
				<Box sx={{ display: "flex", gap: 0.75 }}>
					<Box
						sx={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }}
					/>
					<Box
						sx={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }}
					/>
					<Box
						sx={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }}
					/>
				</Box>
				<Box
					sx={{
						flex: 1,
						padding: "4px 12px",
						marginLeft: 2,
						borderRadius: "6px",
						background:
							"var(--sp-surface, " +
							(theme.palette.mode === "dark" ? "#2a2a2a" : "#ffffff") +
							")",
						border: "1px solid var(--sp-border, " + theme.palette.divider + ")",
						fontFamily: "ui-monospace, Menlo, monospace",
						fontSize: 12,
						color: "var(--sp-text-muted, " + theme.palette.text.secondary + ")",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{url}
				</Box>
			</Box>
			<Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
		</Box>
	);
};

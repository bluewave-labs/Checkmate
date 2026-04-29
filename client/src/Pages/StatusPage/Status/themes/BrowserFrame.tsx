import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { useStatusPageTheme } from "./StatusPageThemeProvider";

interface Props {
	url: string;
	children: ReactNode;
}

export const BrowserFrame = ({ url, children }: Props) => {
	const { tokens } = useStatusPageTheme();

	return (
		<Box
			sx={{
				width: "100%",
				minHeight: "calc(100vh - 180px)",
				display: "flex",
				flexDirection: "column",
				borderRadius: "12px",
				overflow: "hidden",
				border: `1px solid ${tokens.border}`,
				background: tokens.surface,
				color: tokens.text,
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					padding: "10px 14px",
					background: tokens.bg,
					borderBottom: `1px solid ${tokens.border}`,
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
						background: tokens.surface,
						border: `1px solid ${tokens.border}`,
						fontFamily: "ui-monospace, Menlo, monospace",
						fontSize: 12,
						color: tokens.textMuted,
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

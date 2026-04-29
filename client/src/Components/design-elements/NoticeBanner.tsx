import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";

type Severity = "info" | "warning" | "error";

const SEVERITY_GLYPH: Record<Severity, string> = {
	info: "ⓘ",
	warning: "⚠",
	error: "✕",
};

interface NoticeBannerProps {
	severity?: Severity;
	children: React.ReactNode;
}

export const NoticeBanner = ({ severity = "info", children }: NoticeBannerProps) => {
	const theme = useTheme();
	const tone = theme.palette[severity].main;
	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			gap={theme.spacing(LAYOUT.SM)}
			sx={{
				width: "100%",
				p: theme.spacing(LAYOUT.MD),
				borderRadius: 1,
				border: `1px solid ${alpha(tone, 0.45)}`,
				backgroundColor: alpha(tone, 0.08),
				textAlign: "left",
			}}
		>
			<Box
				component="span"
				sx={{
					color: tone,
					fontSize: 18,
					lineHeight: 1,
					mt: "2px",
				}}
				aria-hidden
			>
				{SEVERITY_GLYPH[severity]}
			</Box>
			<Typography
				sx={{ color: theme.palette.text.primary, lineHeight: 1.55, fontSize: 13 }}
			>
				{children}
			</Typography>
		</Stack>
	);
};

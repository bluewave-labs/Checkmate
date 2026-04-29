import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

export const Severities = ["info", "warning", "error"] as const;
export type Severity = (typeof Severities)[number];

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
			width={"100%"}
			p={theme.spacing(LAYOUT.MD)}
			borderRadius={theme.shape.borderRadius}
			border={`1px solid ${alpha(tone, 0.45)}`}
			bgcolor={alpha(tone, 0.08)}
			textAlign={"left"}
		>
			<Box
				component="span"
				color={tone}
				fontSize={typographyLevels.xl}
				lineHeight={1}
				mt={LAYOUT.XXS}
				aria-hidden
			>
				{SEVERITY_GLYPH[severity]}
			</Box>
			<Typography
				color={theme.palette.text.primary}
				lineHeight={1.55}
			>
				{children}
			</Typography>
		</Stack>
	);
};

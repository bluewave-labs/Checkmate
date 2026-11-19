import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

export const AuthBrandPanel = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			flex={1}
			justifyContent="space-between"
			display={{ xs: "none", md: "flex" }}
			sx={{
				background: "linear-gradient(135deg, #0c4d3d 0%, #155a48 60%, #0f5d4a 100%)",
				color: "#fff",
				p: theme.spacing(LAYOUT.XXXL),
				position: "relative",
				overflow: "hidden",
				"&::after": {
					content: '""',
					position: "absolute",
					inset: 0,
					backgroundImage: `
					linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
					linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
					linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%),
					linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)
				`,
					backgroundSize: "80px 80px",
					backgroundPosition: "0 0, 0 40px, 40px -40px, -40px 0px",
					maskImage: "linear-gradient(135deg, transparent 0%, black 70%)",
					WebkitMaskImage: "linear-gradient(135deg, transparent 0%, black 70%)",
					pointerEvents: "none",
				},
			}}
		>
			<div />
			<Stack sx={{ position: "relative", zIndex: 1, gap: theme.spacing(LAYOUT.XS) }}>
				<Typography
					sx={{
						fontSize: typographyLevels.m,
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: "0.12em",
						color: "rgba(255,255,255,0.75)",
					}}
				>
					{t("pages.auth.brandPanel.eyebrow")}
				</Typography>
				<Typography
					sx={{
						fontSize: 44,
						fontWeight: 400,
						lineHeight: 1.1,
						letterSpacing: "-0.02em",
						maxWidth: 460,
					}}
				>
					{t("pages.auth.brandPanel.tagline")}
				</Typography>
				<Typography
					sx={{
						fontSize: 17,
						lineHeight: 1.5,
						color: "rgba(255,255,255,0.75)",
						maxWidth: 460,
					}}
				>
					{t("pages.auth.brandPanel.description")}
				</Typography>
			</Stack>
			<Typography
				sx={{
					position: "relative",
					zIndex: 1,
					color: "rgba(255,255,255,0.5)",
					fontSize: typographyLevels.sm,
				}}
			>
				v{__APP_VERSION__}
			</Typography>
		</Stack>
	);
};

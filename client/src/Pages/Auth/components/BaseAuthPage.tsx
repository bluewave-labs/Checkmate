import Logo from "@/assets/icons/checkmate-icon.svg?react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LanguageSelector, SwitchTheme } from "@/Components/inputs";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface BaseAuthPageProps extends React.PropsWithChildren, StackProps {
	title: string;
	subtitle: string;
}

export const BaseAuthPage = ({
	title,
	subtitle,
	children,
	component,
	onSubmit,
}: BaseAuthPageProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			minHeight="100vh"
			width="100%"
			position="relative"
			sx={{ backgroundColor: theme.palette.background.default }}
		>
			<Stack
				flex={1}
				alignItems="center"
				justifyContent="center"
				position="relative"
				px={theme.spacing(LAYOUT.MD)}
				py={{ xs: theme.spacing(LAYOUT.XXL), md: theme.spacing(LAYOUT.XL) }}
			>
				<Stack
					direction="row"
					spacing={theme.spacing(LAYOUT.XS)}
					alignItems="center"
					sx={{
						position: "absolute",
						top: theme.spacing(LAYOUT.MD),
						right: theme.spacing(LAYOUT.MD),
						zIndex: 3,
					}}
				>
					<LanguageSelector />
					<SwitchTheme />
				</Stack>
				<Box
					component={component as React.ElementType}
					onSubmit={onSubmit}
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: theme.spacing(LAYOUT.MD),
						width: "100%",
						maxWidth: 360,
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(SPACING.XXL)}
						mb={theme.spacing(LAYOUT.XXS)}
					>
						<Box width={28}>
							<Logo width="100%" />
						</Box>
						<Typography
							sx={{
								fontWeight: 500,
								letterSpacing: "-0.01em",
								fontSize: typographyLevels.l,
							}}
						>
							{t("common.appName")}
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(LAYOUT.XXS)}>
						<Typography
							sx={{
								fontSize: typographyLevels.xxxl,
								fontWeight: 400,
								lineHeight: 1.15,
								letterSpacing: "-0.02em",
								color: theme.palette.text.primary,
							}}
						>
							{title}
						</Typography>
						<Typography
							sx={{
								fontSize: typographyLevels.l,
								color: theme.palette.text.secondary,
							}}
						>
							{subtitle}
						</Typography>
					</Stack>
					{children}
				</Box>
			</Stack>
			<AuthBrandPanel />
		</Stack>
	);
};

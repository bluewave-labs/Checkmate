import Stack, { type StackProps } from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Logo from "@/assets/icons/checkmate-icon.svg?react";
import { LanguageSelector, SwitchTheme } from "@/Components/inputs";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LAYOUT } from "@/Utils/Theme/constants";

interface HeaderAuthControlsProps extends StackProps {
	hideLogo?: boolean;
}

export const HeaderAuthControls = ({
	hideLogo = false,
	...stackProps
}: HeaderAuthControlsProps) => {
	// Hooks
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			width={"100%"}
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			px={theme.spacing(12)}
			gap={theme.spacing(LAYOUT.XS)}
			{...stackProps}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(LAYOUT.XS)}
			>
				{!hideLogo && (
					<>
						<Logo style={{ borderRadius: theme.shape.borderRadius }} />
						<Typography sx={{ userSelect: "none" }}>{t("common.appName")}</Typography>
					</>
				)}
			</Stack>
			<Stack
				direction="row"
				spacing={theme.spacing(LAYOUT.XS)}
				alignItems="center"
			>
				<LanguageSelector />
				<SwitchTheme />
			</Stack>
		</Stack>
	);
};

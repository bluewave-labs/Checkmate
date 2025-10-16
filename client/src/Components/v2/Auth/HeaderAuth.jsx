import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Logo from "@/assets/icons/checkmate-icon.svg?react";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LanguageSelector, ThemeSwitch } from "@/Components/v2/Inputs";

export const HeaderAuth = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			width={"100%"}
			direction="row"
			alignItems="center"
			justifyContent="flex-end"
			py={theme.spacing(4)}
			px={theme.spacing(12)}
			gap={theme.spacing(4)}
		>
			<LanguageSelector />
			<ThemeSwitch color="red" />
		</Stack>
	);
};

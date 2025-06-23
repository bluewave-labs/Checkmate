// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Logo from "../../../assets/icons/checkmate-icon.svg?react";
import LanguageSelector from "../../../Components/LanguageSelector";
import ThemeSwitch from "../../../Components/ThemeSwitch";

// Utils
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const AuthHeader = () => {
	// Hooks
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			px={theme.spacing(12)}
			gap={theme.spacing(4)}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(4)}
			>
				<Logo style={{ borderRadius: theme.shape.borderRadius }} />
				<Typography sx={{ userSelect: "none" }}>{t("common.appName")}</Typography>
			</Stack>
			<Stack
				direction="row"
				spacing={theme.spacing(2)}
				alignItems="center"
			>
				<LanguageSelector />
				<ThemeSwitch />
			</Stack>
		</Stack>
	);
};

export default AuthHeader;

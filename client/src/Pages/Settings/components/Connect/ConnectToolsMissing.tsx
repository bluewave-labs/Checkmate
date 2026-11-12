import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LAYOUT } from "@/Utils/Theme/constants";

const MONGO_TOOLS_URL = "https://www.mongodb.com/try/download/database-tools";

export const ConnectToolsMissing = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			gap={theme.spacing(LAYOUT.SM)}
			alignItems="flex-start"
		>
			<Typography color={theme.palette.error.main}>
				{t("pages.settings.form.connect.backup.toolsMissing")}
			</Typography>
			<Typography color={theme.palette.text.secondary}>
				{t("pages.settings.form.connect.backup.toolsMac")}
			</Typography>
			<Link
				href={MONGO_TOOLS_URL}
				target="_blank"
				rel="noopener noreferrer"
			>
				{t("pages.settings.form.connect.backup.toolsLink")}
			</Link>
			<Typography color={theme.palette.text.secondary}>
				{t("pages.settings.form.connect.backup.toolsPath")}
			</Typography>
		</Stack>
	);
};

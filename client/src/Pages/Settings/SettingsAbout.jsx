import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
// Utils
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import Link from "../../Components/Link";

const SettingsAbout = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<ConfigBox>
			<Box>
				<Typography component="h1">{t("settingsAbout")}</Typography>
			</Box>
			<Box>
				<Typography component="h2">Checkmate {2.0}</Typography>
				<Typography sx={{ mt: theme.spacing(2), mb: theme.spacing(6), opacity: 0.6 }}>
					{t("settingsDevelopedBy")}
				</Typography>
				<Link
					level="secondary"
					url="https://github.com/bluewave-labs/checkmate"
					label="https://github.com/bluewave-labs/checkmate"
				/>
			</Box>
		</ConfigBox>
	);
};

export default SettingsAbout;

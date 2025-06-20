import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
// Utils
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Link from "../../Components/Link";

const SettingsDev = ({ isAdmin, HEADER_SX }) => {
	const { t } = useTranslation();

	if (!isAdmin) return null;

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsDev")}
				</Typography>
				<Typography sx={HEADER_SX}>{t("settingsDevDescription")}</Typography>
			</Box>
			<Box>
				<Link
					level="secondary"
					label={t("settingsDevViewJobQueueDetails")}
					url="/queue"
					external={false}
				/>
			</Box>
		</ConfigBox>
	);
};

export default SettingsDev;

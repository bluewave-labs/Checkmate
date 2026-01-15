import StatusBoxes from "@/Components/v1/StatusBoxes/index.jsx";
import StatBox from "@/Components/v1/StatBox/index.jsx";
import { Typography } from "@mui/material";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtils.js";
import { useTranslation } from "react-i18next";

const PageSpeedStatusBoxes = ({ shouldRender, monitor }) => {
	const uptimeDuration = getHumanReadableDuration(monitor?.uptimeDuration);
	const time = getHumanReadableDuration(monitor?.lastChecked);

	const { t } = useTranslation();

	return (
		<StatusBoxes shouldRender={shouldRender}>
			<StatBox
				heading="checks since"
				subHeading={
					<>
						{uptimeDuration}
						<Typography component="span">{t("ago")}</Typography>
					</>
				}
			/>
			<StatBox
				heading="last check"
				subHeading={
					<>
						{time}
						<Typography component="span">{t("ago")}</Typography>
					</>
				}
			/>
		</StatusBoxes>
	);
};

export default PageSpeedStatusBoxes;

import StatusBoxes from "@/Components/v1/StatusBoxes/index.jsx";
import StatBox from "@/Components/v1/StatBox/index.jsx";
import { Typography } from "@mui/material";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtilsLegacy.js";
import { useTranslation } from "react-i18next";

const PageSpeedStatusBoxes = ({ shouldRender, monitorStats }) => {
	const lastChecked = monitorStats?.lastCheckTimestamp
		? Date.now() - monitorStats.lastCheckTimestamp
		: 0;

	// Determine time since last failure
	const timeOfLastFailure = monitorStats?.timeOfLastFailure;
	const timeSinceLastFailure =
		timeOfLastFailure > 0
			? Date.now() - timeOfLastFailure
			: Date.now() - new Date(monitorStats?.createdAt);

	const streakTime = getHumanReadableDuration(timeSinceLastFailure);

	const time = getHumanReadableDuration(lastChecked);

	const { t } = useTranslation();

	return (
		<StatusBoxes shouldRender={shouldRender}>
			<StatBox
				heading="checks since"
				subHeading={
					<>
						{streakTime}
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

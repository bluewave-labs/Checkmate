import StatusBoxes from "@/Components/v1/StatusBoxes/index.jsx";
import StatBox from "@/Components/v1/StatBox/index.jsx";
import { Typography } from "@mui/material";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtils.js";
import { useTranslation } from "react-i18next";

const PageSpeedStatusBoxes = ({ shouldRender, monitor }) => {
	const { t } = useTranslation();

	// Calculate time since first check (checks since)
	const checks = monitor?.checks || [];
	const oldestCheck = checks.length > 0 ? checks[checks.length - 1] : null;
	const oldestCheckTime = oldestCheck?.createdAt
		? new Date(oldestCheck.createdAt).getTime()
		: null;
	const checksSinceDuration = oldestCheckTime ? Date.now() - oldestCheckTime : 0;

	// Calculate time since last check
	const latestCheck = checks.length > 0 ? checks[0] : null;
	const latestCheckTime = latestCheck?.createdAt
		? new Date(latestCheck.createdAt).getTime()
		: null;
	const lastCheckDuration = latestCheckTime ? Date.now() - latestCheckTime : 0;

	const uptimeDuration = getHumanReadableDuration(checksSinceDuration);
	const time = getHumanReadableDuration(lastCheckDuration);

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

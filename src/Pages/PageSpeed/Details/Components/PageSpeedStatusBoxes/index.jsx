import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";
import { Typography } from "@mui/material";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtils";
import { useTranslation } from "react-i18next";

const PageSpeedStatusBoxes = ({ shouldRender, monitor }) => {
	const { time: uptimeDuration, units: uptimeUnits } = getHumanReadableDuration(
		monitor?.uptimeDuration
	);

	const { time: lastCheckTime, units: lastCheckUnits } = getHumanReadableDuration(
		monitor?.lastChecked
	);

	const { t } = useTranslation();

	return (
		<StatusBoxes shouldRender={shouldRender}>
			<StatBox
				heading="checks since"
				subHeading={
					<>
						{uptimeDuration}
						<Typography component="span">{uptimeUnits}</Typography>
						<Typography component="span">{t("ago")}</Typography>
					</>
				}
			/>
			<StatBox
				heading="last check"
				subHeading={
					<>
						{lastCheckTime}
						<Typography component="span">{lastCheckUnits}</Typography>
						<Typography component="span">{t("ago")}</Typography>
					</>
				}
			/>
		</StatusBoxes>
	);
};

export default PageSpeedStatusBoxes;

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import StatBox from "../../../../../Components/StatBox";
import StatusBoxes from "../../../../../Components/StatusBoxes";

import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";

const camelToTitle = (str) => {
	return str
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.replace(/^./, (m) => m.toUpperCase());
};

const Metrics = ({ metrics = {} }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const data = Object.keys(metrics)
		.filter((key) => key !== "jobsWithFailures")
		.map((key) => {
			return { key, title: camelToTitle(key), value: metrics[key] };
		});

	console.log(JSON.stringify(data, null, 2));

	return (
		<Stack gap={theme.spacing(2)}>
			<Typography variant="h2">{t("queuePage.metricsTable.title")}</Typography>
			<StatusBoxes flexWrap="wrap">
				{data.map((metric) => {
					return (
						<StatBox
							key={metric.key}
							heading={metric.title}
							subHeading={metric.value}
						/>
					);
				})}
			</StatusBoxes>
		</Stack>
	);
};
export default Metrics;

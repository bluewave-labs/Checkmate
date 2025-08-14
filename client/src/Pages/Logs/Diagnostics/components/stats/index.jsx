import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";

import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

import { getHumanReadableDuration } from "../../../../../Utils/timeUtils";
import { formatBytes } from "../../utils/utils";
import { useTranslation } from "react-i18next";

const StatsCard = ({ title, value, unit = "", isLoading }) => {
	const theme = useTheme();
	return (
		<Card sx={{ width: 150, maxWidth: 150, height: 80, maxHeight: 80 }}>
			{isLoading ? (
				<Stack
					alignItems="center"
					justifyContent="center"
					height={80}
					maxHeight={80}
				>
					<CircularProgress color="accent" />
				</Stack>
			) : (
				<CardContent>
					<Typography
						variant="body1"
						color={theme.palette.primary.contrastText}
					>
						{title}
					</Typography>
					<Typography variant="body1">
						{value} {unit}
					</Typography>
				</CardContent>
			)}
		</Card>
	);
};

StatsCard.propTypes = {
	title: PropTypes.string,
	value: PropTypes.string,
	unit: PropTypes.string,
	isLoading: PropTypes.bool,
};

const Stats = ({ diagnostics, isLoading }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			direction="row"
			gap={theme.spacing(4)}
			flexWrap="wrap"
		>
			<StatsCard
				title={t("diagnosticsPage.stats.eventLoopDelayTitle")}
				value={getHumanReadableDuration(diagnostics?.eventLoopDelayMs)}
				isLoading={isLoading}
			/>
			<StatsCard
				title={t("diagnosticsPage.stats.uptimeTitle")}
				value={getHumanReadableDuration(diagnostics?.uptimeMs)}
				isLoading={isLoading}
			/>

			<StatsCard
				title={t("diagnosticsPage.stats.usedHeapSizeTitle")}
				value={formatBytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
				isLoading={isLoading}
			/>

			<StatsCard
				title={t("diagnosticsPage.stats.totalHeapSizeTitle")}
				value={formatBytes(diagnostics?.v8HeapStats?.totalHeapSizeBytes)}
				isLoading={isLoading}
			/>

			<StatsCard
				title={t("diagnosticsPage.stats.osMemoryLimitTitle")}
				value={formatBytes(diagnostics?.osStats?.totalMemoryBytes)}
				isLoading={isLoading}
			/>
		</Stack>
	);
};

Stats.propTypes = {
	diagnostics: PropTypes.object,
	isLoading: PropTypes.bool,
};

export default Stats;

import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import PanelSkeleton from "../IncidentsSummaryPanel/skeleton.jsx";
import { useTranslation } from "react-i18next";
import Clock from "@/assets/icons/maintenance.svg?react";
import Incidents from "@/assets/icons/incidents.svg?react";
import NotificationIcon from "@/assets/icons/notifications.svg?react";
import SummaryCard from "../SummaryCard/index.jsx";

/**
 * StatisticsPanel Component
 *
 * Displays key metrics and statistics about incidents.
 *
 * @param {Object} props
 * @param {Object} props.statistics - Statistics data object
 * @param {number} props.statistics.total - Total incidents count
 * @param {number} props.statistics.totalTrend - Trend percentage for total (optional)
 * @param {string} props.statistics.mttr - Mean Time To Resolve (formatted string, e.g., "2h 15m")
 * @param {number} props.statistics.mttrTrend - Trend percentage for MTTR (optional)
 * @param {Object} props.statistics.topMonitor - Top monitor with most incidents
 * @param {string} props.statistics.topMonitor.name - Monitor name
 * @param {number} props.statistics.topMonitor.count - Incident count
 * @param {number} props.statistics.topMonitor.percentage - Percentage of total
 * @param {string} props.statistics.uptimeAffected - Total downtime (formatted string, e.g., "12h 45m")
 * @param {number} props.statistics.availability - Availability percentage
 * @param {boolean} props.isLoading - Loading state
 * @param {Object} props.error - Error object if any
 */
const StatisticsPanel = ({ isLoading = false, error = null, summary = {} }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const totalResolutions =
		(summary?.totalManualResolutions || 0) + (summary?.totalAutomaticResolutions || 0);
	const automaticPercentage =
		totalResolutions > 0
			? (summary?.totalAutomaticResolutions / totalResolutions) * 100
			: 0;

	const iconWrapperStyle = {
		display: "flex",
		justifyContent: "center",
		mx: theme.spacing(2),
		color: theme.palette.primary.contrastTextTertiary,
		"& svg": {
			width: 18,
			height: 18,
		},
		"& svg path": {
			stroke: "currentColor",
			strokeWidth: 1.5,
		},
	};
	if (isLoading) {
		return <PanelSkeleton />;
	}

	if (error) {
		return (
			<SummaryCard>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						minHeight: 200,
					}}
				>
					<Typography
						color="error"
						align="center"
					>
						{t("incidentsPage.incidentsStatisticsPanelError")}
					</Typography>
				</Box>
			</SummaryCard>
		);
	}

	const getMostAffectedMonitor = () => {
		if (!summary.total || summary.total === 0) {
			return t("incidentsPage.none");
		}
		return summary.topMonitor?.monitorName || t("incidentsPage.none");
	};

	return (
		<SummaryCard title={t("incidentsPage.incidentsStatisticsPanelTitle")}>
			<Stack gap={theme.spacing(4)}>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(3)}
				>
					<Box
						sx={{
							...iconWrapperStyle,
						}}
					>
						<NotificationIcon />
					</Box>
					<Box>
						<Typography
							variant="body1"
							sx={{
								fontWeight: 500,
								lineHeight: 1.2,
							}}
						>
							{t("incidentsPage.totalIncidents")}: {summary.total || 0}
						</Typography>
					</Box>
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(2)}
				>
					<Box sx={iconWrapperStyle}>
						<Incidents />
					</Box>
					<Box>
						<Typography
							variant="body1"
							sx={{
								fontWeight: 500,
								lineHeight: 1.2,
							}}
						>
							{t("incidentsPage.mostAffectedMonitor")}: {getMostAffectedMonitor()}
						</Typography>
					</Box>
				</Stack>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(2)}
				>
					<Box sx={iconWrapperStyle}>
						<Clock />
					</Box>
					<Box>
						<Typography
							variant="body1"
							sx={{
								fontWeight: 500,
							}}
						>
							{t("incidentsPage.avgResolutionTime")}:{" "}
							{summary.total > 0 ? `${summary.avgResolutionTimeHours || 0} ${t("incidentsPage.hours")}` : "N/A"}
						</Typography>
					</Box>
				</Stack>
			</Stack>
		</SummaryCard>
	);
};

StatisticsPanel.propTypes = {
	summary: PropTypes.object,
	isLoading: PropTypes.bool,
	error: PropTypes.object,
};

export default StatisticsPanel;

import PropTypes from "prop-types";
import { Box, Stack, Typography, Divider } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PanelSkeleton from "../IncidentsSummaryPanel/skeleton.jsx";
import IncidentItem from "./IncidentItem.jsx";
import SummaryCard from "../SummaryCard/index.jsx";
import CheckIcon from "@/assets/icons/check-icon.svg?react";

/**
 * LatestIncidentsPanel Component
 *
 * Displays a quick overview of recent incidents (both active and resolved).
 * Shows only essential information: monitor name, status, duration, and resolution type.
 *
 * @param {Object} props
 * @param {Array} props.incidents - Array of recent incidents
 * @param {boolean} props.isLoading - Loading state
 * @param {Object} props.error - Error object if any
 */
const LatestIncidentsPanel = ({ incidents = [], isLoading = false, error = null }) => {
	const theme = useTheme();
	const { t } = useTranslation();

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
						{t("incidentsPage.incidentsLatestPanelError")}
					</Typography>
				</Box>
			</SummaryCard>
		);
	}

	return (
		<SummaryCard title={t("incidentsPage.incidentsLatestPanelTitle")}>
			{!incidents || incidents.length === 0 ? (
				<Stack
					direction="column"
					alignItems="center"
					justifyContent="center"
					padding={theme.spacing(6)}
					gap={theme.spacing(2)}
					sx={{ flex: 1 }}
				>
					<Box
						sx={{
							color: theme.palette.success.main,
							"& svg": {
								width: 24,
								height: 24,
								"& path": { stroke: "currentColor", strokeWidth: 2 },
							},
							mb: theme.spacing(1),
						}}
					>
						<CheckIcon />
					</Box>

					<Typography
						sx={{
							fontSize: 13,
							textTransform: "uppercase",
							fontWeight: 500,
							textAlign: "center",
							color: theme.palette.success.lowContrast,
						}}
					>
						{t("incidentsPage.incidentsLatestPanelEmpty")}
					</Typography>
				</Stack>
			) : (
				<Stack gap={theme.spacing(4)}>
					{incidents.map((incident, index) => (
						<Box key={incident._id}>
							<IncidentItem incident={incident} />
							{index < incidents.length - 1 && <Divider sx={{ mt: theme.spacing(2) }} />}
						</Box>
					))}
				</Stack>
			)}
		</SummaryCard>
	);
};

LatestIncidentsPanel.propTypes = {
	incidents: PropTypes.arrayOf(
		PropTypes.shape({
			_id: PropTypes.string,
			monitorId: PropTypes.string,
			monitorName: PropTypes.string,
			status: PropTypes.bool,
			duration: PropTypes.string,
			resolutionType: PropTypes.oneOf(["automatic", "manual"]),
		})
	),
	isLoading: PropTypes.bool,
	error: PropTypes.object,
	onIncidentClick: PropTypes.func,
};

export default LatestIncidentsPanel;

import PropTypes from "prop-types";
import { Box, Stack, Typography, Divider } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PanelSkeleton from "../IncidentsSummaryPanel/skeleton.jsx";
import IncidentItem from "./IncidentItem.jsx";
import SummaryCard from "../SummaryCard/index.jsx";

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
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexGrow: 1,
					}}
				>
					<Typography
						variant="body2"
						textAlign="center"
					>
						{t("incidentsPage.incidentsLatestPanelEmpty")}
					</Typography>
				</Box>
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

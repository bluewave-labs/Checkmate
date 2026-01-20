import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PanelSkeleton from "../IncidentsSummaryPanel/skeleton.jsx";
import Icon from "@/Components/v1/Icon";
import SummaryCard from "../SummaryCard/index.jsx";

/**
 * ActiveIncidentsPanel Component
 *
 * Displays a quick overview of currently active incidents.
 * Shows only essential information: monitor name, status badge, and duration.
 *
 * @param {Object} props
 * @param {Array} props.incidents - Array of active incidents
 * @param {number} props.totalCount - Total count of active incidents (for badge)
 * @param {boolean} props.isLoading - Loading state
 * @param {Object} props.error - Error object if any
 * @param {Function} props.onIncidentClick - Callback when incident is clicked (optional)
 */
const ActiveIncidentsPanel = ({ totalCount = 0, isLoading = false, error = null }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (isLoading) {
		return <PanelSkeleton />;
	}

	if (error) {
		return (
			<SummaryCard>
				<Typography
					color="error"
					align="center"
				>
					{t("incidentsPage.incidentsActivePanelError")}
				</Typography>
			</SummaryCard>
		);
	}

	if (!totalCount || totalCount === 0) {
		return (
			<SummaryCard title={t("incidentsPage.incidentsActivePanelTitle")}>
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
						<Icon
							name="CheckCircle"
							size={60}
						/>
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
						{t("incidentsPage.allSystemsAreOperational")}
					</Typography>
				</Stack>
			</SummaryCard>
		);
	}

	return (
		<SummaryCard title={t("incidentsPage.incidentsActivePanelTitle")}>
			<Stack
				direction="column"
				alignItems="center"
				justifyContent="center"
				gap={theme.spacing(2)}
				sx={{ flex: 1 }}
			>
				<Box
					sx={{
						color: theme.palette.error.lowContrast,
						"& svg": {
							width: 24,
							height: 24,
							"& path": { stroke: "currentColor", strokeWidth: 2 },
						},
					}}
				>
					<Icon
						name="AlertTriangle"
						size={60}
					/>
				</Box>

				<Typography
					sx={{
						fontSize: 32,
						fontWeight: 600,
						color: theme.palette.error.lowContrast,
						lineHeight: 1,
					}}
				>
					{totalCount}
				</Typography>
			</Stack>
		</SummaryCard>
	);
};

ActiveIncidentsPanel.propTypes = {
	totalCount: PropTypes.number,
	isLoading: PropTypes.bool,
	error: PropTypes.object,
	onIncidentClick: PropTypes.func,
};

export default ActiveIncidentsPanel;

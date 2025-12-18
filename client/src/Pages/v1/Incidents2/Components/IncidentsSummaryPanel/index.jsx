import { useEffect, useState } from "react";
// Hooks
import useFetchIncidents from "../../hooks/useFetchIncidents.js";
import PropTypes from "prop-types";
// Components
import { Grid } from "@mui/material";
import ActiveIncidentsPanel from "../ActiveIncidentsPanel/index.jsx";
import LatestIncidentsPanel from "../LatestIncidentsPanel/index.jsx";
import StatisticsPanel from "../StatisticsPanel/index.jsx";

const IncidentsSummaryPanel = ({ updateTrigger }) => {
	const { fetchIncidentSummary } = useFetchIncidents();
	const [summary, setSummary] = useState({
		totalActive: 0,
		avgResolutionTimeHours: 0,
		total: 0,
		topMonitor: null,
		totalManualResolutions: 0,
		totalAutomaticResolutions: 0,
		latestIncidents: [],
	});

	const [isLoadingSummary, setIsLoadingSummary] = useState(false);
	const [summaryError, setSummaryError] = useState(null);

	useEffect(() => {
		const fetchSummary = async () => {
			setIsLoadingSummary(true);
			setSummaryError(null);

			try {
				const summaryData = await fetchIncidentSummary({
					limit: 3,
				});

				if (summaryData) {
					setSummary(summaryData);
				} else {
					setSummaryError(new Error("Failed to fetch summary"));
				}
			} catch (error) {
				console.error("Error fetching incident summary:", error);
				setSummaryError(error);
			} finally {
				setIsLoadingSummary(false);
			}
		};

		fetchSummary();
	}, [fetchIncidentSummary, updateTrigger]);

	return (
		<>
			<Grid
				container
				spacing={3}
			>
				<Grid
					item
					xs={12}
					sm={4}
				>
					<ActiveIncidentsPanel
						totalCount={summary.totalActive || 0}
						isLoading={isLoadingSummary}
						error={summaryError}
					/>
				</Grid>
				<Grid
					item
					xs={12}
					sm={4}
				>
					<LatestIncidentsPanel
						incidents={summary.latestIncidents || []}
						isLoading={isLoadingSummary}
						error={summaryError}
					/>
				</Grid>

				<Grid
					item
					xs={12}
					sm={4}
				>
					<StatisticsPanel
						summary={summary}
						isLoading={isLoadingSummary}
						error={summaryError}
					/>
				</Grid>
			</Grid>
		</>
	);
};

IncidentsSummaryPanel.propTypes = {
	updateTrigger: PropTypes.bool.isRequired,
};
export default IncidentsSummaryPanel;

// Components
import { Stack, Typography, Grid, Box } from "@mui/material";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import SummaryCard from "../Components/SummaryCard";
import useGetIncidentsDuration from "../hooks/useGetIncidentsDuration";

// Utils
import { useParams } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import useFetchIncidents from "../hooks/useFetchIncidents";
import { useEffect, useState } from "react";

// Constants
const BREADCRUMBS = [
	{ name: "incidents", path: "/incidents" },
	{ name: "details", path: "" },
];

const IncidentDetails = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { incidentId } = useParams();
	const { fetchIncidentById } = useFetchIncidents();
	const [incident, setIncident] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const isActive = incident?.status === true;
	const duration = useGetIncidentsDuration(incident || null, isActive);
	useEffect(() => {
		const loadIncident = async () => {
			if (incidentId) {
				setIsLoading(true);
				try {
					const incidentData = await fetchIncidentById(incidentId);
					console.log(incidentData);
					setIncident(incidentData);
				} catch (error) {
					console.error("Error fetching incident:", error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		loadIncident();
	}, [incidentId, fetchIncidentById]);

	if (isLoading) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<GenericFallback
					isLoading={true}
					message={t("incidentsPage.loading", "Loading incident details...")}
				/>
			</Stack>
		);
	}

	if (!incident) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<GenericFallback
					isLoading={false}
					message={t("incidentsPage.incidentNotFound", "Incident not found")}
				/>
			</Stack>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h2">
				{t("incidentsPage.incidentDetails", "Incident Details")}
			</Typography>
			<Stack gap={theme.spacing(10)}>
				<Grid
					container
					spacing={3}
				>
					<Grid
						item
						xs={12}
						sm={4}
					>
						<SummaryCard
							title="Downtime duration"
							isHighPriority={isActive}
							sx={{
								backgroundColor: theme.palette.primary.lowContrast,
								color: theme.palette.primary.contrastTextSecondary,
							}}
						>
							<Typography variant="h6">{duration}</Typography>
						</SummaryCard>
					</Grid>
					<Grid
						item
						xs={12}
						sm={4}
					>
						<SummaryCard title="Started at">
							<Typography variant="h6">{incident?.startTime}</Typography>
						</SummaryCard>
					</Grid>
					{!isActive && (
						<Grid
							item
							xs={12}
							sm={4}
						>
							<SummaryCard title="Ended at">
								<Typography variant="h6">{incident?.endTime}</Typography>
							</SummaryCard>
						</Grid>
					)}
				</Grid>
				<Grid
					container
					spacing={3}
				>
					<Grid
						item
						xs={12}
						sm={4}
					>
						<SummaryCard title="Error details">
							<Typography variant="h6">{incident?.statusCode}</Typography>
							<Typography variant="h6">{incident?.message}</Typography>
						</SummaryCard>
					</Grid>
					<Grid
						item
						xs={12}
						sm={4}
					>
						<SummaryCard title="Total Checks Failed">
							<Typography variant="h6">{incident?.checks.length}</Typography>
						</SummaryCard>
					</Grid>
					{!isActive && (
						<Grid
							item
							xs={12}
							sm={4}
						>
							<SummaryCard title="Resolution Method">
								<Typography variant="h6">{incident?.resolutionType}</Typography>
								{incident?.resolutionType === "manual" && (
									<Stack>
										<Typography variant="h6">
											Resolved by {incident?.resolvedBy?.email}
										</Typography>
										{incident?.comment && (
											<Typography variant="h6">Comment: {incident?.comment}</Typography>
										)}
									</Stack>
								)}
							</SummaryCard>
						</Grid>
					)}
				</Grid>
			</Stack>
		</Stack>
	);
};

export default IncidentDetails;

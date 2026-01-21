// Components
import { Stack, Typography, Grid, Box, Button, Divider } from "@mui/material";
import { GenericDialog } from "@/Components/v1/Dialog/genericDialog.jsx";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import SummaryCard from "@/Pages/Incidents2/Components/SummaryCard";
import ResolveIncidentDialog from "../ResolveIncidentDialog/index.jsx";

// Utils
import { useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/Utils/timeUtils";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

// Hooks
import useFetchIncidents from "@/Pages/Incidents2/hooks/useFetchIncidents";
import useGetIncidentsDuration from "@/Pages/Incidents2/hooks/useGetIncidentsDuration";

const IncidentDetailsModal = ({ open, incidentId, onClose, onResolved }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { fetchIncidentById, resolveIncident } = useFetchIncidents();
	const [incident, setIncident] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const isActive = incident?.status === true;
	const duration = useGetIncidentsDuration(incident || null, isActive);

	const statusColor = isActive ? theme.palette.error.main : theme.palette.success.main;
	const toCapitalLetter = (text) =>
		typeof text === "string" && text.length > 0
			? text.charAt(0).toUpperCase() + text.slice(1)
			: text;

	const KeyValueRow = ({ label, value, sx = {} }) => (
		<Grid
			container
			spacing={2}
			alignItems="flex-start"
			sx={{ ...sx }}
		>
			<Grid
				item
				xs={4}
			>
				<Typography variant="body1">{label}</Typography>
			</Grid>
			<Grid
				item
				xs
			>
				<Typography
					variant="body1"
					textAlign="right"
				>
					{value ?? "-"}
				</Typography>
			</Grid>
		</Grid>
	);

	useEffect(() => {
		const loadIncident = async () => {
			if (!incidentId || !open) {
				setIncident(null);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			try {
				const incidentData = await fetchIncidentById(incidentId);
				setIncident(incidentData);
			} catch (error) {
				console.error("Error fetching incident:", error);
				setIncident(null);
			} finally {
				setIsLoading(false);
			}
		};

		loadIncident();
	}, [incidentId, open, fetchIncidentById]);

	const openResolveDialog = () => {
		setIsResolveDialogOpen(true);
	};

	const closeResolveDialog = () => {
		setIsResolveDialogOpen(false);
	};

	const handleAfterResolve = async () => {
		if (!incidentId) return;
		const updatedIncident = await fetchIncidentById(incidentId);
		if (updatedIncident) {
			setIncident(updatedIncident);
		}
	};

	const renderContent = () => {
		if (isLoading) {
			return (
				<GenericFallback
					isLoading={true}
					message={t("incidentsPage.loadingIncidentDetails")}
				/>
			);
		}

		if (!incident) {
			return (
				<GenericFallback
					isLoading={false}
					message={t("incidentsPage.incidentNotFound")}
				/>
			);
		}

		return (
			<Stack gap={theme.spacing(8)}>
				<Grid
					container
					spacing={3}
				>
					<Grid
						item
						xs={12}
						md={12}
					>
						<SummaryCard title={t("incidentsPage.overview")}>
							<Stack
								direction="row"
								alignItems="center"
								gap={theme.spacing(2)}
								sx={{ mb: theme.spacing(3) }}
							>
								<Box
									sx={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										bgcolor: statusColor,
									}}
								/>
								<Typography
									variant="body2"
									sx={{
										color: statusColor,
										fontWeight: 700,
										letterSpacing: 0.4,
									}}
								>
									{isActive ? t("incidentsPage.active") : t("incidentsPage.resolved")}
								</Typography>
							</Stack>
							<Stack
								direction="column"
								alignItems="start"
								gap={theme.spacing(3)}
							>
								<Stack
									direction="row"
									gap={2}
									sx={{ alignItems: "baseline" }}
								>
									<Typography
										variant="body1"
										color="text.secondary"
										fontWeight={500}
										sx={{ minWidth: 70 }}
									>
										{t("incidentsPage.incidentItemMonitor")}:
									</Typography>
									<Typography
										variant="body1"
										sx={{ flex: 1 }}
									>
										{incident?.monitorId?.name || t("incidentsPage.unknownMonitor")}
									</Typography>
								</Stack>
								<Stack
									direction="row"
									gap={2}
									sx={{ alignItems: "baseline" }}
								>
									<Typography
										variant="body1"
										color="text.secondary"
										fontWeight={500}
										sx={{ minWidth: 70 }}
									>
										{t("incidentsPage.URL")}:
									</Typography>
									<Typography
										variant="body1"
										sx={{ flex: 1, wordBreak: "break-word", fontFamily: "monospace" }}
									>
										{incident?.monitorId?.url || "-"}
									</Typography>
								</Stack>
							</Stack>
						</SummaryCard>
					</Grid>
				</Grid>
				<Grid
					container
					spacing={3}
				>
					<Grid
						item
						xs={12}
						sm={12}
					>
						<SummaryCard title={t("incidentsPage.incidentAnalysis")}>
							<Grid
								container
								spacing={3}
								alignItems="stretch"
							>
								<Grid
									item
									xs={12}
									sm={6}
								>
									<Stack gap={theme.spacing(2)}>
										<Typography
											variant="subtitle1"
											fontWeight={700}
										>
											{t("incidentsPage.timeline")}
										</Typography>
										<Divider sx={{ mt: 2 }} />

										<KeyValueRow
											label={t("incidentsPage.startedAt")}
											value={
												formatDateWithTz(
													incident?.startTime,
													"D MMM YYYY, h:mm A",
													uiTimezone
												) || "-"
											}
											sx={{ paddingBottom: theme.spacing(3) }}
										/>
										{!isActive && (
											<KeyValueRow
												label={t("incidentsPage.endedAt")}
												value={
													formatDateWithTz(
														incident?.endTime,
														"D MMM YYYY, h:mm A",
														uiTimezone
													) || "-"
												}
												sx={{ paddingBottom: theme.spacing(3) }}
											/>
										)}

										<KeyValueRow
											label={t("incidentsPage.downtime")}
											value={duration || "-"}
										/>
									</Stack>
								</Grid>
								<Grid
									item
									sm="auto"
									sx={{ display: { xs: "none", sm: "flex" } }}
								>
									<Divider
										orientation="vertical"
										flexItem
									/>
								</Grid>
								<Grid
									item
									xs={12}
									sm
								>
									<Stack gap={theme.spacing(2)}>
										<Typography
											variant="subtitle1"
											sx={{ letterSpacing: 0.6, fontWeight: 700 }}
										>
											{isActive
												? t("incidentsPage.errorDetails")
												: t("incidentsPage.resolutionDetails")}
										</Typography>

										<Divider sx={{ mt: 2 }} />

										<KeyValueRow
											label={t("incidentsPage.statusCode")}
											value={incident?.statusCode ?? "-"}
										/>

										<Typography
											variant="body2"
											sx={{
												fontFamily: "monospace",

												wordBreak: "break-word",
												lineHeight: 1.6,
											}}
										>
											{incident?.message || "-"}
										</Typography>

										{!isActive && (
											<>
												<Divider sx={{ mb: theme.spacing(2) }} />

												<KeyValueRow
													label={t("incidentsPage.resolutionMethod")}
													value={toCapitalLetter(incident?.resolutionType) || "-"}
												/>
												{incident?.resolutionType === "manual" && (
													<>
														<KeyValueRow
															label={t("incidentsPage.resolvedBy")}
															value={incident?.resolvedBy?.email || "Unknown"}
														/>

														<KeyValueRow
															label={t("incidentsPage.comment")}
															value={
																incident?.comment?.trim()
																	? incident.comment
																	: t("incidentsPage.noCommentProvided")
															}
														/>
													</>
												)}
											</>
										)}
									</Stack>
								</Grid>
							</Grid>
						</SummaryCard>
					</Grid>
				</Grid>
			</Stack>
		);
	};

	return (
		<GenericDialog
			open={open}
			onClose={onClose}
			theme={theme}
			title={t("incidentsPage.incidentDetails")}
			width={{ xs: "95%", md: "45%", lg: "40%", xl: "35%" }}
		>
			<Stack
				gap={theme.spacing(6)}
				sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1 }}
			>
				{renderContent()}
				<Stack
					direction="row"
					justifyContent="flex-end"
					gap={2}
					sx={{ pt: theme.spacing(3) }}
				>
					{isActive && (
						<Button
							variant="outlined"
							color="error"
							onClick={openResolveDialog}
						>
							{t("incidentsPage.incidentsTableActionResolveManually")}
						</Button>
					)}

					<Button
						variant="contained"
						color="secondary"
						onClick={onClose}
					>
						{t("close")}
					</Button>
				</Stack>
				<ResolveIncidentDialog
					open={isResolveDialogOpen}
					incidentId={incidentId}
					onClose={closeResolveDialog}
					onResolve={resolveIncident}
					onAfterResolve={handleAfterResolve}
					onResolved={onResolved}
				/>
			</Stack>
		</GenericDialog>
	);
};

IncidentDetailsModal.propTypes = {
	open: PropTypes.bool.isRequired,
	incidentId: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	onResolved: PropTypes.func,
};

export default IncidentDetailsModal;

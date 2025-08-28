import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Box,
	Card,
	CardContent,
	Stack,
	Typography,
	IconButton,
	Button,
	Chip,
	Grid,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HttpIcon from "@mui/icons-material/Http";
import { StatusLabel } from "../../../Components/Label";
import { HttpStatusLabel } from "../../../Components/HttpStatusLabel";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { formatDateWithTz } from "../../../Utils/timeUtils";
import { useSelector } from "react-redux";
import { useFetchCheckById } from "../../../Hooks/checkHooks";
import { useResolveIncident } from "../../../Hooks/checkHooks";
import NetworkError from "../../../Components/GenericFallback/NetworkError";
import TableSkeleton from "../../../Components/Table/skeleton";

const IncidentDetails = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { checkId } = useParams();
	const uiTimezone = useSelector((state) => state.ui.timezone);

	// Hooks
	const [check, isLoading, networkError] = useFetchCheckById(checkId);
	const [resolveIncident, resolveLoading] = useResolveIncident();

	const [updateTrigger, setUpdateTrigger] = useState(false);

	const BREADCRUMBS = [
		{ name: t("incidentsPageTitle"), path: "/incidents" },
		{ name: t("incidentDetails.title"), path: `/incidents/details/${checkId}` },
	];

	const handleResolve = () => {
		resolveIncident(checkId, setUpdateTrigger);
	};

	const handleBack = () => {
		navigate("/incidents");
	};

	if (isLoading || resolveLoading) {
		return <TableSkeleton />;
	}

	if (networkError) {
		return <NetworkError />;
	}

	if (!check) {
		return (
			<Box p={3}>
				<Typography>{t("incidentDetails.notFound")}</Typography>
			</Box>
		);
	}

	const isDown = !check.status;
	const statusColor = isDown ? theme.palette.error.main : theme.palette.success.main;
	const statusBgColor = isDown ? "rgba(244, 67, 54, 0.1)" : "rgba(76, 175, 80, 0.1)";

	// Parse response time data
	const timingData = check.responseTime || {};
	const totalTime = timingData.total || check.responseTime || 0;

	return (
		<Stack spacing={3}>
			<Breadcrumbs list={BREADCRUMBS} />
			
			{/* Header Section */}
			<Card
				sx={{
					backgroundColor: theme.palette.primary.main,
					border: `1px solid ${theme.palette.primary.lowContrast}`,
					borderRadius: 2,
					boxShadow: theme.shape.boxShadow,
				}}
			>
				<CardContent>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="flex-start"
						mb={2}
					>
						<Box>
							<Stack direction="row" alignItems="center" spacing={1} mb={1}>
								<Typography
									variant="h1"
									sx={{ 
										fontSize: theme.typography.h1.fontSize,
										fontWeight: 500,
										color: theme.palette.primary.contrastText,
									}}
								>
									{check.monitorName || t("incidentDetails.unknownMonitor")}
								</Typography>
								<Chip
									label={isDown ? t("status.down") : t("status.up")}
									sx={{
										backgroundColor: statusBgColor,
										color: statusColor,
										fontWeight: 600,
										border: `1px solid ${statusColor}`,
									}}
								/>
							</Stack>
							<Typography
								variant="body2"
								sx={{ 
									color: theme.palette.primary.contrastTextSecondary,
									fontFamily: "monospace",
								}}
							>
								Monitor ID: {check.monitorId}
							</Typography>
						</Box>
						<Stack direction="row" spacing={1}>
							{!check.ack && (
								<Button
									variant="contained"
									color="accent"
									onClick={handleResolve}
									disabled={resolveLoading}
								>
									{t("incidentDetails.resolve")}
								</Button>
							)}
							<IconButton onClick={handleBack}>
								<ArrowBackIcon />
							</IconButton>
						</Stack>
					</Stack>
				</CardContent>
			</Card>

			{/* Key Metrics Cards */}
			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<Card
						sx={{
							backgroundColor: theme.palette.primary.main,
							border: `1px solid ${theme.palette.primary.lowContrast}`,
							borderRadius: 2,
							height: "100%",
						}}
					>
						<CardContent>
							<Stack spacing={1}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<HttpIcon sx={{ color: theme.palette.primary.contrastTextSecondary }} />
									<Typography
										variant="body2"
										sx={{ color: theme.palette.primary.contrastTextSecondary }}
									>
										{t("incidentDetails.statusCode")}
									</Typography>
								</Stack>
								<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
									<HttpStatusLabel status={check.statusCode || "N/A"} size="large" />
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={4}>
					<Card
						sx={{
							backgroundColor: theme.palette.primary.main,
							border: `1px solid ${theme.palette.primary.lowContrast}`,
							borderRadius: 2,
							height: "100%",
						}}
					>
						<CardContent>
							<Stack spacing={1}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<AccessTimeIcon sx={{ color: theme.palette.primary.contrastTextSecondary }} />
									<Typography
										variant="body2"
										sx={{ color: theme.palette.primary.contrastTextSecondary }}
									>
										{t("incidentDetails.responseTime")}
									</Typography>
								</Stack>
								<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
									<Typography
										variant="h2"
										sx={{
											fontSize: "2.5rem",
											fontWeight: 600,
											color: totalTime > 1000
												? theme.palette.warning.main
												: theme.palette.success.main,
										}}
									>
										{totalTime.toFixed(0)}
										<Typography
											component="span"
											sx={{
												fontSize: "1.2rem",
												ml: 0.5,
												color: theme.palette.primary.contrastTextSecondary,
											}}
										>
											ms
										</Typography>
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={4}>
					<Card
						sx={{
							backgroundColor: theme.palette.primary.main,
							border: `1px solid ${theme.palette.primary.lowContrast}`,
							borderRadius: 2,
							height: "100%",
						}}
					>
						<CardContent>
							<Stack spacing={1}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<LocationOnIcon sx={{ color: theme.palette.primary.contrastTextSecondary }} />
									<Typography
										variant="body2"
										sx={{ color: theme.palette.primary.contrastTextSecondary }}
									>
										{t("incidentDetails.location")}
									</Typography>
								</Stack>
								<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
									<Stack alignItems="center" spacing={0.5}>
										<Typography
											variant="h6"
											sx={{
												fontSize: "1.5rem",
												fontWeight: 500,
												color: theme.palette.primary.contrastText,
											}}
										>
											{check.location?.city || t("incidentDetails.defaultLocation")}
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: theme.palette.primary.contrastTextSecondary }}
										>
											{check.location?.country || t("incidentDetails.defaultCountry")}
										</Typography>
									</Stack>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Timing Breakdown & Metadata */}
			<Grid container spacing={2}>
				{/* Timing Breakdown */}
				<Grid item xs={12} md={6}>
					<Card
						sx={{
							backgroundColor: theme.palette.primary.main,
							border: `1px solid ${theme.palette.primary.lowContrast}`,
							borderRadius: 2,
							height: "100%",
						}}
					>
						<CardContent>
							<Typography
								variant="h6"
								sx={{
									mb: 2,
									fontWeight: 500,
									color: theme.palette.primary.contrastText,
								}}
							>
								{t("incidentDetails.timingBreakdown")}
							</Typography>
							<Stack spacing={2}>
								{[
									{ label: t("incidentDetails.dns"), value: timingData.dns || 0, key: "dns" },
									{ label: t("incidentDetails.tcp"), value: timingData.tcp || 0, key: "tcp" },
									{ label: t("incidentDetails.tls"), value: timingData.tls || 0, key: "tls" },
									{ label: t("incidentDetails.firstByte"), value: timingData.firstByte || 0, key: "firstByte" },
									{ label: t("incidentDetails.transfer"), value: timingData.transfer || 0, key: "transfer" },
									{ label: t("incidentDetails.total"), value: totalTime, key: "total" },
								].map((item) => (
									<Stack
										key={item.key}
										direction="row"
										justifyContent="space-between"
										alignItems="center"
										sx={{
											pb: 1,
											borderBottom: item.key !== "total" ? `1px solid ${theme.palette.primary.lowContrast}` : "none",
										}}
									>
										<Typography
											variant="body2"
											sx={{
												color: theme.palette.primary.contrastTextSecondary,
												fontWeight: item.key === "total" ? 600 : 400,
											}}
										>
											{item.label}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												color: item.key === "total" 
													? theme.palette.primary.contrastText
													: theme.palette.primary.contrastTextTertiary,
												fontWeight: item.key === "total" ? 600 : 400,
											}}
										>
											{item.value.toFixed(2)}ms
										</Typography>
									</Stack>
								))}
							</Stack>
						</CardContent>
					</Card>
				</Grid>

				{/* Incident Metadata */}
				<Grid item xs={12} md={6}>
					<Card
						sx={{
							backgroundColor: theme.palette.primary.main,
							border: `1px solid ${theme.palette.primary.lowContrast}`,
							borderRadius: 2,
							height: "100%",
						}}
					>
						<CardContent>
							<Typography
								variant="h6"
								sx={{
									mb: 2,
									fontWeight: 500,
									color: theme.palette.primary.contrastText,
								}}
							>
								{t("incidentDetails.metadata")}
							</Typography>
							<Stack spacing={2}>
								<Stack spacing={1}>
									<Typography
										variant="body2"
										sx={{ color: theme.palette.primary.contrastTextSecondary }}
									>
										{t("incidentDetails.monitorType")}
									</Typography>
									<Typography
										variant="body1"
										sx={{ color: theme.palette.primary.contrastText }}
									>
										{check.type || "HTTP"}
									</Typography>
								</Stack>

								<Stack spacing={1}>
									<Typography
										variant="body2"
										sx={{ color: theme.palette.primary.contrastTextSecondary }}
									>
										{t("incidentDetails.incidentTime")}
									</Typography>
									<Typography
										variant="body1"
										sx={{ 
											color: theme.palette.primary.contrastText,
											fontFamily: "monospace",
										}}
									>
										{formatDateWithTz(check.createdAt, "YYYY-MM-DD HH:mm:ss", uiTimezone)}
									</Typography>
								</Stack>

								{check.ack && (
									<Stack spacing={1}>
										<Typography
											variant="body2"
											sx={{ color: theme.palette.primary.contrastTextSecondary }}
										>
											{t("incidentDetails.resolvedAt")}
										</Typography>
										<Typography
											variant="body1"
											sx={{ 
												color: theme.palette.success.main,
												fontFamily: "monospace",
											}}
										>
											{formatDateWithTz(check.ackAt, "YYYY-MM-DD HH:mm:ss", uiTimezone)}
										</Typography>
									</Stack>
								)}

								{check.message && (
									<Stack spacing={1}>
										<Typography
											variant="body2"
											sx={{ color: theme.palette.primary.contrastTextSecondary }}
										>
											{t("incidentDetails.errorMessage")}
										</Typography>
										<Typography
											variant="body1"
											sx={{ 
												color: theme.palette.error.main,
												fontFamily: "monospace",
												wordBreak: "break-word",
											}}
										>
											{check.message}
										</Typography>
									</Stack>
								)}

								<Stack spacing={1}>
									<Typography
										variant="body2"
										sx={{ color: theme.palette.primary.contrastTextSecondary }}
									>
										{t("incidentDetails.monitorUrl")}
									</Typography>
									<Typography
										variant="body1"
										sx={{ 
											color: theme.palette.primary.contrastText,
											fontFamily: "monospace",
											wordBreak: "break-all",
										}}
									>
										{check.url || "N/A"}
									</Typography>
								</Stack>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Stack>
	);
};

export default IncidentDetails;
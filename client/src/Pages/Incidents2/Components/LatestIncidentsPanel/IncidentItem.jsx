import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import { getHumanReadableDuration } from "@/Utils/timeUtils.js";
import Icon from "@/Components/v1/Icon";
import { useTranslation } from "react-i18next";

const IncidentItem = ({ incident }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isActive = incident.status === true;
	const calculateDuration = () => {
		if (!incident.startTime) {
			return "-";
		}
		const startTime = new Date(incident.startTime);
		const endTime = isActive
			? new Date()
			: incident.endTime
				? new Date(incident.endTime)
				: null;

		if (!endTime) {
			return "-";
		}

		const durationMs = endTime.getTime() - startTime.getTime();

		if (durationMs < 0) {
			return "-";
		}

		return getHumanReadableDuration(durationMs);
	};

	const duration = calculateDuration();
	const iconWrapperStyle = {
		px: theme.spacing(2),
		display: "flex",
		justifyContent: "center",
		color: theme.palette.primary.contrastTextTertiary,
		"& svg path": {
			stroke: "currentColor",
		},
	};

	return (
		<Box
			sx={{
				cursor: "pointer",
				width: "100%",
				py: theme.spacing(0.5),
				"&:hover": { opacity: 0.8 },
			}}
		>
			<Stack
				direction="column"
				gap={theme.spacing(1.5)}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(1)}
				>
					<Box
						sx={{
							...iconWrapperStyle,
						}}
					>
						<Icon
							name="Globe"
							size={20}
						/>
					</Box>

					<Stack
						direction="row"
						gap={theme.spacing(4)}
						alignItems="baseline"
					>
						<Typography variant="body1">
							{t("incidentsPage.incidentItemMonitor")}:
						</Typography>
						<Typography
							variant="body1"
							fontWeight={600}
						>
							{incident.monitorName || t("incidentsPage.unknownMonitor")}
						</Typography>
					</Stack>
				</Stack>

				<Stack
					direction="row"
					alignItems="center"
					width="100%"
					marginTop={theme.spacing(1)}
				>
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(3)}
					>
						<Box sx={{ ...iconWrapperStyle }}>
							<Icon
								name="Wifi"
								size={20}
							/>
						</Box>
						<Stack
							direction="row"
							alignItems="center"
							spacing={2}
						>
							<Typography variant="body1">
								{t("incidentsPage.incidentItemStatus")}:
							</Typography>
						</Stack>

						<StatusLabel
							status={isActive ? "down" : "up"}
							text={isActive ? t("incidentsPage.active") : t("incidentsPage.resolved")}
							customStyles={{
								textTransform: "capitalize",
							}}
						/>
					</Stack>

					<Box sx={{ flexGrow: 1 }} />

					<Typography
						variant="body1"
						fontWeight={500}
					>
						{duration}
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);
};

IncidentItem.propTypes = {
	incident: PropTypes.shape({
		_id: PropTypes.string,
		id: PropTypes.string,
		monitorId: PropTypes.string,
		monitorName: PropTypes.string,
		status: PropTypes.bool,
		startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
		endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
		resolutionType: PropTypes.oneOf(["automatic", "manual"]),
	}),
	onClick: PropTypes.func,
};

export default IncidentItem;

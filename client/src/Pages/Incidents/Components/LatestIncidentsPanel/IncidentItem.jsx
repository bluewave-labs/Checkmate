import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import { getHumanReadableDuration } from "@/Utils/timeUtilsLegacy.js";
import Icon from "@/Components/v1/Icon";
import { useTranslation } from "react-i18next";
import useGetIncidentsDuration from "../../hooks/useGetIncidentsDuration";

const IncidentItem = ({ incident }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isActive = incident.status === true;
	const duration = useGetIncidentsDuration(incident, isActive);
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

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "1fr 100px 80px",
				alignItems: "center",
				gap: theme.spacing(2),
				width: "100%",
				py: theme.spacing(0.5),
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(2)}
			>
				<Box sx={iconWrapperStyle}>
					<Icon
						name="Globe"
						size={18}
					/>
				</Box>
				<Typography
					variant="body1"
					fontWeight={500}
					noWrap
				>
					{incident.monitorName || t("incidentsPage.unknownMonitor")}
				</Typography>
			</Stack>

			<Box sx={{ display: "flex", justifyContent: "center" }}>
				<StatusLabel
					status={isActive ? "down" : "up"}
					text={isActive ? t("incidentsPage.active") : t("incidentsPage.resolved")}
					customStyles={{
						textTransform: "capitalize",
					}}
				/>
			</Box>

			<Typography
				variant="body1"
				fontWeight={500}
				textAlign="right"
			>
				{duration}
			</Typography>
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

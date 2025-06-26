// Components
import { Stack, Typography, Button, ButtonGroup } from "@mui/material";
import Select from "../../../../Components/Inputs/Select";
import PropTypes from "prop-types";

//Utils
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";
import { useTranslation } from "react-i18next";

const OptionsHeader = ({
	shouldRender,
	selectedMonitor = 0,
	setSelectedMonitor,
	monitors,
	filter = "all",
	setFilter,
	dateRange = "hour",
	setDateRange,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const monitorNames = typeof monitors !== "undefined" ? Object.values(monitors) : [];

	// The stacks below which are three in number have the same style so
	const stackStyles = {
		direction: "row",
		alignItems: "center",
		gap: theme.spacing(6),
	};

	if (!shouldRender) return <SkeletonLayout />;

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Stack {...stackStyles}>
				<Typography
					display="inline-block"
					component="h1"
					color={theme.palette.primary.contrastTextSecondary}
				>
					{t("incidentsOptionsHeader")}
				</Typography>
				<Select
					id="incidents-select-monitor"
					placeholder={t("incidentsOptionsPlaceholderAllServers")}
					value={selectedMonitor}
					onChange={(e) => setSelectedMonitor(e.target.value)}
					items={monitorNames}
					sx={{
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastTextSecondary,
					}}
					maxWidth={250}
				/>
			</Stack>
			<Stack {...stackStyles}>
				<Typography
					display="inline-block"
					component="h1"
					color={theme.palette.primary.contrastTextSecondary}
				>
					{t("incidentsOptionsHeaderFilterBy")}
				</Typography>
				<ButtonGroup>
					<Button
						variant="group"
						filled={(filter === "all").toString()}
						onClick={() => setFilter("all")}
					>
						{t("incidentsOptionsHeaderFilterAll")}
					</Button>
					<Button
						variant="group"
						filled={(filter === "down").toString()}
						onClick={() => setFilter("down")}
					>
						{t("incidentsOptionsHeaderFilterDown")}
					</Button>
					<Button
						variant="group"
						filled={(filter === "resolve").toString()}
						onClick={() => setFilter("resolve")}
					>
						{t("incidentsOptionsHeaderFilterCannotResolve")}
					</Button>
					{/* <Button
						variant="group"
						filled={(filter === "resolved").toString()}
						onClick={() => setFilter("resolved")}
					>
						{t("incidentsOptionsHeaderFilterResolved")}
					</Button> */}
				</ButtonGroup>
			</Stack>
			<Stack {...stackStyles}>
				<Typography
					display="inline-block"
					component="h1"
					color={theme.palette.primary.contrastTextSecondary}
				>
					{t("incidentsOptionsHeaderShow")}
				</Typography>
				<ButtonGroup>
					<Button
						variant="group"
						filled={(dateRange === "hour").toString()}
						onClick={() => setDateRange("hour")}
					>
						{t("incidentsOptionsHeaderLastHour")}
					</Button>
					<Button
						variant="group"
						filled={(dateRange === "day").toString()}
						onClick={() => setDateRange("day")}
					>
						{t("incidentsOptionsHeaderLastDay")}
					</Button>
					<Button
						variant="group"
						filled={(dateRange === "week").toString()}
						onClick={() => setDateRange("week")}
					>
						{t("incidentsOptionsHeaderLastWeek")}
					</Button>
					<Button
						variant="group"
						filled={(dateRange === "all").toString()}
						onClick={() => setDateRange("all")}
					>
						{t("incidentsOptionsHeaderFilterAll")}
					</Button>
				</ButtonGroup>
			</Stack>
		</Stack>
	);
};

OptionsHeader.propTypes = {
	shouldRender: PropTypes.bool,
	selectedMonitor: PropTypes.string,
	setSelectedMonitor: PropTypes.func,
	monitors: PropTypes.object,
	filter: PropTypes.string,
	setFilter: PropTypes.func,
	dateRange: PropTypes.string,
	setDateRange: PropTypes.func,
};

export default OptionsHeader;

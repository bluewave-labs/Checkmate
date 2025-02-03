// Components
import { Stack, Typography, Button, ButtonGroup } from "@mui/material";
import Select from "../../../../Components/Inputs/Select";
import PropTypes from "prop-types";

//Utils
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

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
	const monitorNames = typeof monitors !== "undefined" ? Object.values(monitors) : [];

	if (!shouldRender) return <SkeletonLayout />;

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(6)}
			>
				<Typography
					display="inline-block"
					component="h1"
					color={theme.palette.primary.contrastTextSecondary}
				>
					Incidents for
				</Typography>
				<Select
					id="incidents-select-monitor"
					placeholder="All servers"
					value={selectedMonitor}
					onChange={(e) => setSelectedMonitor(e.target.value)}
					items={monitorNames}
					sx={{
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastTextSecondary,
					}}
				/>
			</Stack>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(6)}
			>
				<Typography
					display="inline-block"
					component="h1"
					color={theme.palette.primary.contrastTextSecondary}
				>
					Filter by:
				</Typography>
				<ButtonGroup
					sx={{
						ml: "auto",
						"& .MuiButtonBase-root, & .MuiButtonBase-root:hover": {
							borderColor: theme.palette.primary.lowContrast,
						},
					}}
				>
					<Button
						variant="group"
						filled={(filter === "all").toString()}
						onClick={() => setFilter("all")}
					>
						All
					</Button>
					<Button
						variant="group"
						filled={(filter === "down").toString()}
						onClick={() => setFilter("down")}
					>
						Down
					</Button>
					<Button
						variant="group"
						filled={(filter === "resolve").toString()}
						onClick={() => setFilter("resolve")}
					>
						Cannot resolve
					</Button>
				</ButtonGroup>
			</Stack>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(6)}
			>
				<Typography
					display="inline-block"
					component="h1"
					color={theme.palette.primary.contrastTextSecondary}
				>
					Show:
				</Typography>
				<ButtonGroup
					sx={{
						ml: "auto",
						"& .MuiButtonBase-root, & .MuiButtonBase-root:hover": {
							borderColor: theme.palette.primary.lowContrast,
						},
					}}
				>
					<Button
						variant="group"
						filled={(dateRange === "hour").toString()}
						onClick={() => setDateRange("hour")}
					>
						Last hour
					</Button>
					<Button
						variant="group"
						filled={(dateRange === "day").toString()}
						onClick={() => setDateRange("day")}
					>
						Last day
					</Button>
					<Button
						variant="group"
						filled={(dateRange === "week").toString()}
						onClick={() => setDateRange("week")}
					>
						Last week
					</Button>
					<Button
						variant="group"
						filled={(dateRange === "all").toString()}
						onClick={() => setDateRange("all")}
					>
						All
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

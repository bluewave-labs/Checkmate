// Components
import { Stack, Box, Typography, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import Host from "../../../../../Components/Host";
import StatusPageBarChart from "../../../../../Components/Charts/StatusPageBarChart";
import { StatusLabel } from "../../../../../Components/Label";

//Utils
import { useTheme } from "@mui/material/styles";
import { useMonitorUtils } from "../../../../../Hooks/useMonitorUtils";
import PropTypes from "prop-types";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useSelector } from "react-redux";

const MonitorsList = ({ isLoading = false, shouldRender = true, monitors = [] }) => {
	const theme = useTheme();
	const { determineState } = useMonitorUtils();
	const { t } = useTranslation();
	const { showURL } = useSelector((state) => state.ui);

	// State for managing collapsed/expanded groups
	const [collapsedGroups, setCollapsedGroups] = useState(new Set());

	// Group monitors by their group field
	const groupedMonitors = useMemo(() => {
		const groups = {};
		
		monitors?.forEach((monitor) => {
			const groupName = monitor.group || t("ungrouped");
			if (!groups[groupName]) {
				groups[groupName] = [];
			}
			groups[groupName].push(monitor);
		});

		return groups;
	}, [monitors, t]);

	// Handle group toggle
	const toggleGroup = (groupName) => {
		const newCollapsedGroups = new Set(collapsedGroups);
		if (collapsedGroups.has(groupName)) {
			newCollapsedGroups.delete(groupName);
		} else {
			newCollapsedGroups.add(groupName);
		}
		setCollapsedGroups(newCollapsedGroups);
	};

	// Render individual monitor
	const renderMonitor = (monitor) => {
		const status = determineState(monitor);
		return (
			<Stack
				key={monitor._id}
				width="100%"
				gap={theme.spacing(2)}
				sx={{ ml: theme.spacing(4) }} // Indent monitors within groups
			>
				<Host
					key={monitor._id}
					url={monitor.url}
					title={monitor.name}
					percentageColor={monitor.percentageColor}
					percentage={monitor.percentage}
					showURL={showURL}
				/>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(20)}
				>
					<Box flex={9}>
						<StatusPageBarChart checks={monitor?.checks?.slice().reverse()} />
					</Box>
					<Box flex={1}>
						<StatusLabel
							status={status}
							text={status}
							customStyles={{ textTransform: "capitalize" }}
						/>
					</Box>
				</Stack>
			</Stack>
		);
	};

	// If no grouping, render monitors normally
	if (Object.keys(groupedMonitors).length <= 1 && groupedMonitors[t("ungrouped")]) {
		return (
			<>
				{monitors?.map(renderMonitor)}
			</>
		);
	}

	// Render grouped monitors with collapsible sections
	return (
		<>
			{Object.entries(groupedMonitors).map(([groupName, groupMonitors]) => {
				const isCollapsed = collapsedGroups.has(groupName);
				const isUngrouped = groupName === t("ungrouped");
				
				return (
					<Stack key={groupName} width="100%" gap={theme.spacing(2)}>
						{/* Group Header */}
						<Stack
							direction="row"
							alignItems="center"
							sx={{
								cursor: "pointer",
								py: theme.spacing(2),
								px: theme.spacing(2),
								borderRadius: theme.spacing(2),
								backgroundColor: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								"&:hover": {
									backgroundColor: theme.palette.action.hover,
								},
							}}
							onClick={() => toggleGroup(groupName)}
						>
							<Typography 
								variant="h6" 
								sx={{ 
									flex: 1,
									fontWeight: isUngrouped ? 400 : 600,
									color: isUngrouped ? theme.palette.text.secondary : theme.palette.text.primary,
								}}
							>
								{groupName} ({groupMonitors.length})
							</Typography>
							<IconButton size="small">
								{isCollapsed ? <ExpandMore /> : <ExpandLess />}
							</IconButton>
						</Stack>

						{/* Group Content */}
						<Collapse in={!isCollapsed}>
							<Stack gap={theme.spacing(4)}>
								{groupMonitors.map(renderMonitor)}
							</Stack>
						</Collapse>
					</Stack>
				);
			})}
		</>
	);
};

MonitorsList.propTypes = {
	monitors: PropTypes.array.isRequired,
};

export default MonitorsList;

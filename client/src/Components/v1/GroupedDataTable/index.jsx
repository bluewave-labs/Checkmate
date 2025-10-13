import { useState } from "react";
import { Box, Stack, Typography, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import DataTable from "../Table/index.jsx";
import ConfigBox from "../ConfigBox/index.jsx";
import { useTranslation } from "react-i18next";

/**
 * GroupSection component for displaying a collapsible group of monitors
 * @param {Object} props - Component props
 * @param {string} props.groupName - Name of the group
 * @param {Array} props.monitors - Array of monitors in this group
 * @param {Array} props.headers - Table headers configuration
 * @param {Object} props.config - Table configuration
 * @param {boolean} props.defaultExpanded - Whether the group should be expanded by default
 * @returns {JSX.Element} Rendered component
 */
const GroupSection = ({
	groupName,
	monitors,
	headers,
	config,
	defaultExpanded = true,
}) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const theme = useTheme();
	const { t } = useTranslation();

	const toggleExpanded = () => {
		setExpanded(!expanded);
	};

	return (
		<Box
			sx={{
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.primary.lowContrast,
				borderRadius: theme.spacing(2),
				backgroundColor: theme.palette.primary.main,
				overflow: "hidden",
			}}
		>
			{/* Group Header */}
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{
					padding: theme.spacing(6, 8),
					backgroundColor: theme.palette.tertiary.background,
					borderBottom: expanded ? 1 : 0,
					borderBottomStyle: "solid",
					borderBottomColor: theme.palette.primary.lowContrast,
					cursor: "pointer",
				}}
				onClick={toggleExpanded}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(4)}
				>
					<Typography
						variant="h3"
						sx={{
							color: theme.palette.primary.contrastTextSecondary,
							fontWeight: 600,
						}}
					>
						{groupName}
					</Typography>
					<Typography
						variant="body2"
						sx={{
							color: theme.palette.primary.contrastTextTertiary,
							backgroundColor: theme.palette.primary.lowContrast,
							borderRadius: theme.spacing(1),
							padding: theme.spacing(1, 3),
							fontSize: "0.75rem",
						}}
					>
						{monitors.length} {monitors.length === 1 ? t("monitor") : t("monitors")}
					</Typography>
				</Stack>
				<IconButton
					size="small"
					sx={{
						color: theme.palette.primary.contrastTextSecondary,
					}}
				>
					{expanded ? <ExpandLess /> : <ExpandMore />}
				</IconButton>
			</Stack>

			{/* Group Content */}
			<Collapse in={expanded}>
				<Box sx={{ padding: 0 }}>
					<DataTable
						headers={headers}
						data={monitors}
						config={{
							...config,
							emptyView: `No monitors in ${groupName}`,
						}}
					/>
				</Box>
			</Collapse>
		</Box>
	);
};

/**
 * GroupedDataTable component for displaying monitors organized by groups
 * @param {Object} props - Component props
 * @param {Object} props.groupedMonitors - Object containing grouped and ungrouped monitors
 * @param {Object} props.groupedMonitors.grouped - Object with group names as keys and monitor arrays as values
 * @param {Array} props.groupedMonitors.ungrouped - Array of monitors without groups
 * @param {Array} props.headers - Table headers configuration
 * @param {Object} props.config - Table configuration
 * @param {boolean} props.shouldRender - Whether to render the component
 * @returns {JSX.Element} Rendered component
 */
const GroupedDataTable = ({ groupedMonitors, headers, config, shouldRender = true }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!shouldRender) {
		return null;
	}

	const { grouped, ungrouped } = groupedMonitors;
	const groupNames = Object.keys(grouped);
	const hasGroups = groupNames.length > 0;
	const hasUngrouped = ungrouped.length > 0;

	// If no groups and no ungrouped monitors, show empty state
	if (!hasGroups && !hasUngrouped) {
		return (
			<DataTable
				headers={headers}
				data={[]}
				config={{
					...config,
					emptyView: config.emptyView || "No monitors found",
				}}
			/>
		);
	}

	// If no groups but have ungrouped monitors, show regular table
	if (!hasGroups && hasUngrouped) {
		return (
			<DataTable
				headers={headers}
				data={ungrouped}
				config={config}
			/>
		);
	}

	return (
		<Stack gap={theme.spacing(6)}>
			{/* Grouped Monitors */}
			{groupNames.map((groupName) => (
				<GroupSection
					key={groupName}
					groupName={groupName}
					monitors={grouped[groupName]}
					headers={headers}
					config={config}
					defaultExpanded={true}
				/>
			))}

			{/* Ungrouped Monitors */}
			{hasUngrouped && (
				<GroupSection
					groupName={t("ungroupedMonitors", "Other Monitors")}
					monitors={ungrouped}
					headers={headers}
					config={config}
					defaultExpanded={groupNames.length === 0}
				/>
			)}
		</Stack>
	);
};

GroupSection.propTypes = {
	groupName: PropTypes.string.isRequired,
	monitors: PropTypes.array.isRequired,
	headers: PropTypes.array.isRequired,
	config: PropTypes.object,
	defaultExpanded: PropTypes.bool,
};

GroupedDataTable.propTypes = {
	groupedMonitors: PropTypes.shape({
		grouped: PropTypes.object.isRequired,
		ungrouped: PropTypes.array.isRequired,
	}).isRequired,
	headers: PropTypes.array.isRequired,
	config: PropTypes.object,
	shouldRender: PropTypes.bool,
};

export default GroupedDataTable;

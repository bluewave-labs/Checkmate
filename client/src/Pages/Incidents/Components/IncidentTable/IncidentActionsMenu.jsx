// Components
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@/Components/v1/Icon/index.jsx";
import ResolveIncidentDialog from "../ResolveIncidentDialog/index.jsx";

// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { TypeToPathMap } from "@/Utils/monitorUtilsLegacy.js";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const IncidentActionsMenu = ({ incident, monitor, onResolve, onOpenDetails }) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const openMenu = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const closeMenu = (e) => {
		if (e) {
			e.stopPropagation();
		}
		setAnchorEl(null);
	};

	const openResolveDialog = (e) => {
		closeMenu(e);
		setIsDialogOpen(true);
	};

	const closeDialog = (e) => {
		if (e) {
			e.stopPropagation();
		}
		setIsDialogOpen(false);
	};

	const isActive = incident.status === true;
	const handleGoToDetails = (e) => {
		e.stopPropagation();
		closeMenu(e);
		if (onOpenDetails) {
			onOpenDetails(incident.id);
		}
	};

	const handleGoToMonitor = async (e) => {
		e.stopPropagation();
		closeMenu(e);
		try {
			if (monitor) {
				const path = TypeToPathMap[monitor.type];
				if (path && monitor.id) {
					navigate(`/${path}/${monitor.id}`);
				} else {
					console.error(`Monitor type not found`);
				}
			} else {
				console.error("Monitor information not found in incident data");
			}
		} catch (error) {
			console.error("Error fetching incident details:", error);
		}
	};

	return (
		<>
			<IconButton
				aria-label="incident actions"
				onClick={(event) => {
					event.stopPropagation();
					openMenu(event);
				}}
				sx={{
					"&:focus": {
						outline: "none",
					},
					"& svg path": {
						stroke: theme.palette.primary.contrastTextTertiary,
					},
				}}
			>
				<Icon
					name="Settings"
					size={20}
				/>
			</IconButton>

			<Menu
				className="incident-actions-menu"
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={closeMenu}
				disableScrollLock
				slotProps={{
					paper: {
						sx: {
							"& ul": {
								p: theme.spacing(2.5),
								backgroundColor: theme.palette.primary.main,
							},
							"& li": { m: 0, color: theme.palette.primary.contrastTextSecondary },
						},
					},
				}}
			>
				<MenuItem onClick={handleGoToDetails}>
					{t("incidentsPage.incidentsTableActionDetails", "Details")}
				</MenuItem>
				<MenuItem onClick={handleGoToMonitor}>
					{t("incidentsPage.incidentsTableActionGoToMonitor", "Go to monitor")}
				</MenuItem>
				{isActive && (
					<MenuItem
						onClick={(e) => {
							e.stopPropagation();
							openResolveDialog(e);
						}}
					>
						{t("incidentsPage.incidentsTableActionResolveManually")}
					</MenuItem>
				)}
			</Menu>
			<ResolveIncidentDialog
				open={isDialogOpen}
				incidentId={incident.id}
				onClose={closeDialog}
				onResolve={onResolve}
			/>
		</>
	);
};

IncidentActionsMenu.propTypes = {
	incident: PropTypes.shape({
		id: PropTypes.string.isRequired,
		status: PropTypes.bool.isRequired,
	}).isRequired,
	monitor: PropTypes.shape({
		id: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
	}).isRequired,
	onResolve: PropTypes.func.isRequired,
	onOpenDetails: PropTypes.func,
};

export default IncidentActionsMenu;

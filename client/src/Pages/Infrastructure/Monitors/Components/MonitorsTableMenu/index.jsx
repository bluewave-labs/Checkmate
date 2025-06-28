/* TODO I basically copied and pasted this component from the actionsMenu. Check how we can make it reusable */

import { useRef, useState, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { createToast } from "../../../../../Utils/toastUtils";
import { IconButton, Menu, MenuItem } from "@mui/material";
import Settings from "../../../../../assets/icons/settings-bold.svg?react";
import PropTypes from "prop-types";
import Dialog from "../../../../../Components/Dialog";
import { networkService } from "../../../../../Utils/NetworkService.js";
import { usePauseMonitor } from "../../../../../Hooks/monitorHooks";
import { useTranslation } from "react-i18next";

/**
 * InfrastructureMenu Component
 * Provides a dropdown menu for managing infrastructure monitors.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.monitor - The monitor object containing details about the infrastructure monitor.
 * @param {string} props.monitor.id - Unique ID of the monitor.
 * @param {string} [props.monitor.url] - URL associated with the monitor.
 * @param {string} props.monitor.type - Type of monitor (e.g., uptime, infrastructure).
 * @param {boolean} props.monitor.isActive - Indicates if the monitor is currently active.
 * @param {boolean} props.isAdmin - Whether the user has admin privileges.
 * @param {Function} props.updateCallback - Callback to trigger when the monitor data is updated.
 * @returns {JSX.Element} The rendered component.
 */
const InfrastructureMenu = ({ monitor, isAdmin, updateCallback }) => {
	const anchor = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [localMonitorState, setLocalMonitorState] = useState(monitor);
	const theme = useTheme();
	const [pauseMonitor] = usePauseMonitor();
	const { t } = useTranslation();
	
	// Update local state when monitor prop changes
	useEffect(() => {
		// Ensure we have a valid monitor object with default values for missing properties
		if (monitor) {
			setLocalMonitorState({
				...monitor,
				status: monitor.status || 'active' // Default to active if status is undefined
			});
		}
	}, [monitor]);

	const openMenu = (e) => {
		e.stopPropagation();
		setIsOpen(true);
	};

	const closeMenu = (e) => {
		e.stopPropagation();
		setIsOpen(false);
	};

	const openRemove = (e) => {
		closeMenu(e);
		setIsDialogOpen(true);
	};
	const cancelRemove = () => {
		setIsDialogOpen(false);
	};

	const navigate = useNavigate();

	function openDetails(id) {
		navigate(`/infrastructure/${id}`);
	}

	const openConfigure = (id) => {
		navigate(`/infrastructure/configure/${id}`);
	};

	const handlePause = async () => {
		try {
			// Toggle the local state immediately for better UI responsiveness
			setLocalMonitorState(prevState => ({
				...prevState,
				status: prevState.status === "paused" ? "active" : "paused"
			}));
			
			// Pass updateCallback as triggerUpdate to the hook
			await pauseMonitor({ monitorId: monitor.id, triggerUpdate: updateCallback });
			// Toast is already displayed in the hook, no need to display it again
		} catch (error) {
			// Error handling is done in the hook - revert the local state on error
			setLocalMonitorState(prevState => ({
				...prevState,
				status: prevState.status === "paused" ? "active" : "paused"
			}));
		}
	};

	const handleRemove = async () => {
		try {
			await networkService.deleteMonitorById({
				monitorId: monitor.id,
			});
			createToast({ body: t("monitorActions.deleteSuccess", "Monitor deleted successfully") });
		} catch (error) {
			createToast({ body: t("monitorActions.deleteFailed", "Failed to delete monitor") });
		} finally {
			setIsDialogOpen(false);
			updateCallback();
		}
	};

	return (
		<>
			<IconButton
				aria-label="monitor actions"
				onClick={openMenu}
				disabled={!isAdmin}
				sx={{
					"&:focus": {
						outline: "none",
					},
					"& svg path": {
						stroke: theme.palette.primary.contrastTextTertiary,
					},
				}}
				ref={anchor}
			>
				<Settings />
			</IconButton>

			<Menu
				className="actions-menu"
				anchorEl={anchor.current}
				open={isOpen}
				onClose={closeMenu}
				disableScrollLock
				slotProps={{
					paper: {
						sx: {
							"& ul": { p: theme.spacing(2.5) },
							"& li": { m: 0 },
							"& li:last-of-type": {
								color: theme.palette.error.main,
							},
						},
					},
				}}
			>
				<MenuItem onClick={(e) => {
					e.stopPropagation();
					openDetails(monitor.id);
					closeMenu(e);
				}}>{t("monitorActions.details", "Details")}</MenuItem>
				{isAdmin && (
					<MenuItem onClick={(e) => {
						e.stopPropagation();
						openConfigure(monitor.id);
						closeMenu(e);
					}}>{t("configure", "Configure")}</MenuItem>
				)}
				{isAdmin && (
					<MenuItem onClick={async (e) => {
						e.stopPropagation();
						await handlePause();
						closeMenu(e);
					}}>
						{localMonitorState?.status === "paused" ? t("resume", "Resume") : t("pause", "Pause")}
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem
						onClick={openRemove}
						sx={{ color: theme.palette.error.main }}
					>
						{t("remove", "Remove")}
					</MenuItem>
				)}
			</Menu>
			<Dialog
				open={isDialogOpen}
				theme={theme}
				title={t("deleteDialogTitle", "Do you really want to delete this monitor?")}
				description={t("deleteDialogDescription", "Once deleted, this monitor cannot be retrieved.")}
				onCancel={cancelRemove}
				confirmationButtonLabel={t("delete", "Delete")}
				onConfirm={handleRemove}
				modelTitle="modal-delete-monitor"
				modelDescription="delete-monitor-confirmation"
			/>
		</>
	);
};

InfrastructureMenu.propTypes = {
	monitor: PropTypes.shape({
		id: PropTypes.string.isRequired,
		url: PropTypes.string,
		type: PropTypes.string, // Made optional
		isActive: PropTypes.bool,
		status: PropTypes.string,
	}).isRequired,
	isAdmin: PropTypes.bool.isRequired,
	updateCallback: PropTypes.func.isRequired,
};

export { InfrastructureMenu };

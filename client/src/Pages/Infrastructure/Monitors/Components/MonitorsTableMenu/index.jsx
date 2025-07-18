/* TODO I basically copied and pasted this component from the actionsMenu. Check how we can make it reusable */

import { useRef, useState } from "react";
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
 * @param {boolean} props.monitor.isActive - Indicates if the monitor is currently active (true) or paused (false).
 * @param {boolean} props.isAdmin - Whether the user has admin privileges.
 * @param {Function} props.updateCallback - Callback to trigger when the monitor data is updated.
 * @returns {JSX.Element} The rendered component.
 */
const InfrastructureMenu = ({ monitor, isAdmin, updateCallback }) => {
	const anchor = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const theme = useTheme();
	const [pauseMonitor] = usePauseMonitor();
	const { t } = useTranslation();

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
		// Pass updateCallback as triggerUpdate to the hook
		await pauseMonitor({ monitorId: monitor.id, triggerUpdate: updateCallback });
		// Toast is already displayed in the hook, no need to display it again
	};

	const handleRemove = async () => {
		try {
			await networkService.deleteMonitorById({
				monitorId: monitor.id,
			});
			createToast({
				body: t("monitorActions.deleteSuccess"),
			});
		} catch (error) {
			createToast({ body: t("monitorActions.deleteFailed") });
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
				<MenuItem
					onClick={(e) => {
						e.stopPropagation();
						openDetails(monitor.id);
						closeMenu(e);
					}}
				>
					{t("monitorActions.details")}
				</MenuItem>
				{isAdmin && (
					<MenuItem
						onClick={(e) => {
							e.stopPropagation();
							openConfigure(monitor.id);
							closeMenu(e);
						}}
					>
						{t("configure")}
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem
						onClick={async (e) => {
							e.stopPropagation();
							await handlePause();
							closeMenu(e);
						}}
					>
						{!monitor.isActive ? t("resume") : t("pause")}
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem
						onClick={openRemove}
						sx={{ color: theme.palette.error.main }}
					>
						{t("remove")}
					</MenuItem>
				)}
			</Menu>
			<Dialog
				open={isDialogOpen}
				theme={theme}
				title={t("deleteDialogTitle")}
				description={t("deleteDialogDescription")}
				onCancel={cancelRemove}
				confirmationButtonLabel={t("delete")}
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
		// Note: type must remain optional. Making it required (type: PropTypes.string.isRequired)
		// causes runtime errors as some monitors don't have a defined type property
		type: PropTypes.string,
		isActive: PropTypes.bool, // Determines whether the monitor is paused (false) or active (true)
		status: PropTypes.string, // Represents the monitor's operational status (e.g., 'up', 'down', etc.)
	}).isRequired,
	isAdmin: PropTypes.bool.isRequired,
	updateCallback: PropTypes.func.isRequired,
};

export { InfrastructureMenu };

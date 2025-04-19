/* TODO I basically copied and pasted this component from the actionsMenu. Check how we can make it reusable */

import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { createToast } from "../../../../../Utils/toastUtils";
import { IconButton, Menu, MenuItem } from "@mui/material";
import Settings from "../../../../../assets/icons/settings-bold.svg?react";
import PropTypes from "prop-types";
import Dialog from "../../../../../Components/Dialog";
import { networkService } from "../../../../../Utils/NetworkService.js";

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
	const theme = useTheme();
	const { isLoading } = useSelector((state) => state.uptimeMonitors);

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

	const handleRemove = async () => {
		try {
			await networkService.deleteMonitorById({
				monitorId: monitor.id,
			});
			createToast({ body: "Monitor deleted successfully." });
		} catch (error) {
			createToast({ body: "Failed to delete monitor." });
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
				{isAdmin && <MenuItem onClick={openRemove}>Remove</MenuItem>}
			</Menu>
			<Dialog
				open={isDialogOpen}
				theme={theme}
				title="Do you really want to delete this monitor?"
				description="Once deleted, this monitor cannot be retrieved."
				onCancel={cancelRemove}
				confirmationButtonLabel="Delete"
				onConfirm={handleRemove}
				isLoading={isLoading}
				modelTitle="modal-delete-monitor"
				modelDescription="delete-monitor-confirmation"
			/>
		</>
	);
};

InfrastructureMenu.propTypes = {
	monitor: PropTypes.shape({
		id: PropTypes.string,
		url: PropTypes.string,
		type: PropTypes.string,
		isActive: PropTypes.bool,
	}).isRequired,
	isAdmin: PropTypes.bool,
	updateCallback: PropTypes.func,
};

export { InfrastructureMenu };

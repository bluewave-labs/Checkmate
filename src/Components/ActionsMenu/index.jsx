import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { createToast } from "../../Utils/toastUtils";
import { logger } from "../../Utils/Logger";
import { IconButton, Menu, MenuItem } from "@mui/material";
import {
	deleteUptimeMonitor,
	pauseUptimeMonitor,
} from "../../Features/UptimeMonitors/uptimeMonitorsSlice";
import Settings from "../../assets/icons/settings-bold.svg?react";
import PropTypes from "prop-types";
import Dialog from "../../Components/Dialog";

const ActionsMenu = ({
	monitor,
	isAdmin,
	updateRowCallback,
	pauseCallback,
	setIsLoading = () => {},
}) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const [actions, setActions] = useState({});
	const [isOpen, setIsOpen] = useState(false);
	const dispatch = useDispatch();
	const theme = useTheme();
	const authState = useSelector((state) => state.auth);
	const authToken = authState.authToken;
	const { isLoading } = useSelector((state) => state.uptimeMonitors);

	const handleRemove = async (event) => {
		event.preventDefault();
		event.stopPropagation();
		let monitor = { _id: actions.id };
		const action = await dispatch(
			deleteUptimeMonitor({ authToken: authState.authToken, monitor })
		);
		if (action.meta.requestStatus === "fulfilled") {
			setIsOpen(false); // close modal
			updateRowCallback();
			createToast({ body: "Monitor deleted successfully." });
		} else {
			createToast({ body: "Failed to delete monitor." });
		}
	};

	const handlePause = async () => {
		try {
			setIsLoading(true);
			const action = await dispatch(
				pauseUptimeMonitor({ authToken, monitorId: monitor._id })
			);
			if (pauseUptimeMonitor.fulfilled.match(action)) {
				const state = action?.payload?.data.isActive === false ? "paused" : "resumed";
				createToast({ body: `Monitor ${state} successfully.` });
				pauseCallback();
			} else {
				throw new Error(action?.error?.message ?? "Failed to pause monitor.");
			}
		} catch (error) {
			logger.error("Error pausing monitor:", monitor._id, error);
			createToast({ body: "Failed to pause monitor." });
		}
	};

	const openMenu = (event, id, url) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
		setActions({ id: id, url: url });
	};

	const openRemove = (e) => {
		closeMenu(e);
		setIsOpen(true);
	};

	const closeMenu = (e) => {
		e.stopPropagation();
		setAnchorEl(null);
	};

	const navigate = useNavigate();
	return (
		<>
			<IconButton
				aria-label="monitor actions"
				onClick={(event) => {
					event.stopPropagation();
					openMenu(event, monitor._id, monitor.type === "ping" ? null : monitor.url);
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
				<Settings />
			</IconButton>

			<Menu
				className="actions-menu"
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={(e) => closeMenu(e)}
				disableScrollLock
				slotProps={{
					paper: {
						sx: {
							"& ul": {
								p: theme.spacing(2.5),
								backgroundColor: theme.palette.primary.main,
							},
							"& li": { m: 0, color: theme.palette.primary.contrastTextSecondary },
							/* 
							This should not be set automatically on the last of type
							"& li:last-of-type": {
								color: theme.palette.error.main,
							}, */
						},
					},
				}}
			>
				{actions.url !== null ? (
					<MenuItem
						onClick={(e) => {
							closeMenu(e);
							e.stopPropagation();
							window.open(actions.url, "_blank", "noreferrer");
						}}
					>
						Open site
					</MenuItem>
				) : (
					""
				)}
				<MenuItem
					onClick={(e) => {
						e.stopPropagation();
						navigate(`/uptime/${actions.id}`);
					}}
				>
					Details
				</MenuItem>
				{/* TODO - pass monitor id to Incidents page */}
				<MenuItem
					onClick={(e) => {
						e.stopPropagation();
						navigate(`/incidents/${actions.id}`);
					}}
				>
					Incidents
				</MenuItem>
				{isAdmin && (
					<MenuItem
						onClick={(e) => {
							e.stopPropagation();

							navigate(`/uptime/configure/${actions.id}`);
						}}
					>
						Configure
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/uptime/create/${actions.id}`);
						}}
					>
						Clone
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem
						onClick={(e) => {
							closeMenu(e);

							e.stopPropagation();
							handlePause(e);
						}}
					>
						{monitor?.isActive === true ? "Pause" : "Resume"}
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem
						onClick={(e) => {
							e.stopPropagation();
							openRemove(e);
						}}
						sx={{ "&.MuiButtonBase-root": { color: theme.palette.error.main } }}
					>
						Remove
					</MenuItem>
				)}
			</Menu>
			<Dialog
				open={isOpen}
				theme={theme}
				title="Do you really want to delete this monitor?"
				description="Once deleted, this monitor cannot be retrieved."
				/* Do we need stop propagation? */
				onCancel={(e) => {
					e.stopPropagation();
					setIsOpen(false);
				}}
				confirmationButtonLabel="Delete"
				/* Do we need stop propagation? */
				onConfirm={(e) => {
					e.stopPropagation();
					handleRemove(e);
				}}
				isLoading={isLoading}
				modelTitle="modal-delete-monitor"
				modelDescription="delete-monitor-confirmation"
			/>
		</>
	);
};

ActionsMenu.propTypes = {
	monitor: PropTypes.shape({
		_id: PropTypes.string,
		url: PropTypes.string,
		type: PropTypes.string,
		isActive: PropTypes.bool,
	}).isRequired,
	isAdmin: PropTypes.bool,
	updateRowCallback: PropTypes.func,
	pauseCallback: PropTypes.func,
	setIsLoading: PropTypes.func,
};

export default ActionsMenu;

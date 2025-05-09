import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { logger } from "../../../../Utils/Logger";
import Settings from "../../../../assets/icons/settings-bold.svg?react";
import PropTypes from "prop-types";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";

import Dialog from "../../../../Components/Dialog";

const ActionsMenu = ({ /* isAdmin, */ maintenanceWindow, updateCallback }) => {
	maintenanceWindow;
	const [anchorEl, setAnchorEl] = useState(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const theme = useTheme();
	const { t } = useTranslation();

	const handleRemove = async (event) => {
		event.preventDefault();
		event.stopPropagation();
		try {
			setIsLoading(true);
			await networkService.deleteMaintenanceWindow({
				maintenanceWindowId: maintenanceWindow._id,
			});
			updateCallback();
			createToast({ body: t("maintenanceWindowDeletedSuccessfully") });
		} catch (error) {
			createToast({ body: t("failedToDeleteMaintenanceWindow") });
			logger.error("Failed to delete maintenance window", error);
		} finally {
			setIsLoading(false);
		}
		setIsOpen(false);
	};

	const handlePause = async () => {
		try {
			setIsLoading(true);
			const data = {
				active: !maintenanceWindow.active,
			};
			await networkService.editMaintenanceWindow({
				maintenanceWindowId: maintenanceWindow._id,
				maintenanceWindow: data,
			});
			updateCallback();
		} catch (error) {
			logger.error(error);
			createToast({ body: t("failedToPauseMaintenanceWindow") });
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = () => {
		navigate(`/maintenance/create/${maintenanceWindow._id}`);
	};

	const openMenu = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
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
						closeMenu(e);
						e.stopPropagation();
						handleEdit();
					}}
				>
					{t("edit")}
				</MenuItem>
				<MenuItem
					onClick={(e) => {
						handlePause();
						closeMenu(e);
						e.stopPropagation();
					}}
				>
					{`${maintenanceWindow.active === true ? t("pause") : t("resume")}`}
				</MenuItem>

				<MenuItem
					onClick={(e) => {
						e.stopPropagation();
						openRemove(e);
					}}
				>
					{t("remove")}
				</MenuItem>
			</Menu>
			<Dialog
				open={isOpen}
				theme={theme}
				title={t("maintenanceTableActionMenuDialogTitle")}
				onCancel={(e) => {
					e.stopPropagation();
					setIsOpen(false);
				}}
				confirmationButtonLabel={t("delete")}
				onConfirm={(e) => {
					e.stopPropagation(e);
					handleRemove(e);
				}}
				isLoading={isLoading}
			/>
		</>
	);
};

ActionsMenu.propTypes = {
	maintenanceWindow: PropTypes.object,
	isAdmin: PropTypes.bool,
	updateCallback: PropTypes.func,
};

export default ActionsMenu;

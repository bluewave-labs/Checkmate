// Components
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Settings from "../../../../../assets/icons/settings-bold.svg?react";
import { GenericDialog } from "@/Components/v1/Dialog/genericDialog.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import { Button, Stack } from "@mui/material";
import useFetchIncidents from "../../hooks/useFetchIncidents";

// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { TypeToPathMap } from "@/Utils/monitorUtils.js";
import PropTypes from "prop-types";

const IncidentActionsMenu = ({ incident, onResolve }) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [comment, setComment] = useState("");
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { fetchIncidentById } = useFetchIncidents();
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
		setComment("");
		setIsDialogOpen(true);
	};

	const closeDialog = (e) => {
		if (e) {
			e.stopPropagation();
		}
		setComment("");
		setIsDialogOpen(false);
	};

	const handleConfirmResolve = (e) => {
		e.stopPropagation();
		if (onResolve) {
			const options = comment.trim() ? { comment: comment.trim() } : {};
			onResolve(incident._id, options);
		}
		setComment("");
		setIsDialogOpen(false);
	};

	const isActive = incident.status === true;
	const handleGoToDetails = (e) => {
		e.stopPropagation();
		closeMenu(e);
		navigate(`/incidents/details/${incident._id}`);
	};

	const handleGoToMonitor = async (e) => {
		e.stopPropagation();
		closeMenu(e);
		try {
			const incidentData = await fetchIncidentById(incident._id);
			console.log(incidentData);
			if (incidentData) {
				const { type, _id: monitorId } = incidentData.monitorId;
				const path = TypeToPathMap[type];
				if (path && monitorId) {
					navigate(`/${path}/${monitorId}`);
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
				<Settings />
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
				<MenuItem onClick={handleGoToDetails}>
					{t("incidentsPage.incidentsTableActionDetails", "Details")}
				</MenuItem>
				<MenuItem onClick={handleGoToMonitor}>
					{t("incidentsPage.incidentsTableActionGoToMonitor", "Go to monitor")}
				</MenuItem>
				<MenuItem
				//onClick={handleResolve}
				>
					Add comment
				</MenuItem>
				{/* Future options will be added here */}
			</Menu>
			<GenericDialog
				open={isDialogOpen}
				theme={theme}
				title={t("incidentsPage.resolveIncidentDialogTitle")}
				description={t("incidentsPage.resolveIncidentDialogDescription")}
				onClose={closeDialog}
			>
				<Stack gap={theme.spacing(4)}>
					<TextInput
						label={t("incidentsPage.resolveIncidentDialogCommentLabel")}
						placeholder={t("incidentsPage.resolveIncidentDialogCommentPlaceholder")}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						maxWidth="100%"
					/>
					<Stack
						direction="row"
						gap={theme.spacing(4)}
						mt={theme.spacing(4)}
						justifyContent="flex-end"
					>
						<Button
							variant="contained"
							color="secondary"
							onClick={closeDialog}
						>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							variant="contained"
							color="error"
							onClick={handleConfirmResolve}
						>
							{t("incidentsPage.resolveIncidentDialogConfirm")}
						</Button>
					</Stack>
				</Stack>
			</GenericDialog>
		</>
	);
};

IncidentActionsMenu.propTypes = {
	incident: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		status: PropTypes.bool.isRequired,
	}).isRequired,
	onResolve: PropTypes.func.isRequired,
};

export default IncidentActionsMenu;

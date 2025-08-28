import { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@emotion/react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslation } from "react-i18next";
import Proptypes from "prop-types";

const AddMemberMenu = ({ handleInviteOpen, handleIsRegisterOpen }) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);
	const { t } = useTranslation();
	const theme = useTheme();
	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<>
			<Button
				variant="contained"
				color="accent"
				endIcon={<ArrowDropDownIcon sx={{ color: theme.palette.secondary.light }} />}
				onClick={handleClick}
			>
				Add Team Member
			</Button>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				sx={{
					"& .MuiPaper-root": {
						minWidth: anchorEl?.offsetWidth || "auto",
					},
				}}
			>
				<MenuItem
					onClick={() => {
						handleClose();
						handleInviteOpen();
					}}
				>
					{t("teamPanel.inviteTeamMember")}
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleClose();
						handleIsRegisterOpen(true);
					}}
				>
					{t("teamPanel.register")}
				</MenuItem>
			</Menu>
		</>
	);
};

AddMemberMenu.propTypes = {
	handleInviteOpen: Proptypes.func.isRequired,
	handleIsRegisterOpen: Proptypes.func.isRequired,
};

export default AddMemberMenu;

// Components
import Menu from "@mui/material/Menu";
import IconButton from "@mui/material/IconButton";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import MenuItem from "@mui/material/MenuItem";

// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const ActionMenu = ({ notification, onDelete }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);

	// Handlers
	const handleClick = (event) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (event) => {
		if (event) {
			event.stopPropagation();
		}
		setAnchorEl(null);
	};

	const handleRemove = (e) => {
		e.stopPropagation();
		onDelete(notification._id);
		handleClose();
	};

	const handleConfigure = (e) => {
		e.stopPropagation();
		navigate(`/notifications/${notification._id}`);
		handleClose();
	};

	return (
		<>
			<IconButton
				aria-label="notification actions"
				onClick={handleClick}
				onMouseDown={(e) => e.stopPropagation()}
			>
				<SettingsOutlinedIcon />
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
				<MenuItem onClick={handleConfigure}>Configure</MenuItem>
				<MenuItem
					onClick={handleRemove}
					sx={{ "&.MuiButtonBase-root": { color: theme.palette.error.main } }}
				>
					Remove
				</MenuItem>
			</Menu>
		</>
	);
};

ActionMenu.propTypes = {
	notification: PropTypes.object,
	onDelete: PropTypes.func,
};

export default ActionMenu;

import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createToast } from "../../Utils/toastUtils";
import { useExportMonitors } from "../../Hooks/monitorHooks";

const options = ["Import Monitors", "Export Monitors"];

const MonitorActions = ({ isLoading }) => {
	const [open, setOpen] = React.useState(false);
	const anchorRef = React.useRef(null);
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [exportMonitors, isExporting] = useExportMonitors();

	const handleClick = async () => {
		if (selectedIndex === 0) {
			// Import
			navigate("/uptime/bulk-import");
		} else {
			// Export
			const [success, error] = await exportMonitors();
			if (!success) {
				createToast({ body: error || t("export.failed") });
			}
		}
	};

	const handleMenuItemClick = (event, index) => {
		setSelectedIndex(index);
		setOpen(false);
	};

	const handleToggle = () => {
		setOpen((prevOpen) => !prevOpen);
	};

	const handleClose = (event) => {
		if (anchorRef.current && anchorRef.current.contains(event.target)) {
			return;
		}
		setOpen(false);
	};

	return (
		<React.Fragment>
			<ButtonGroup
				variant="contained"
				color="accent"
				ref={anchorRef}
				aria-label="Monitor actions"
				disabled={isLoading || isExporting}
			>
				<Button onClick={handleClick}>{options[selectedIndex]}</Button>
				<Button
					size="small"
					aria-controls={open ? "split-button-menu" : undefined}
					aria-expanded={open ? "true" : undefined}
					aria-label="select monitor action"
					aria-haspopup="menu"
					onClick={handleToggle}
				>
					<ArrowDropDownIcon />
				</Button>
			</ButtonGroup>
			<Popper
				sx={{ zIndex: 1 }}
				open={open}
				anchorEl={anchorRef.current}
				role={undefined}
				transition
				disablePortal
			>
				{({ TransitionProps, placement }) => (
					<Grow
						{...TransitionProps}
						style={{
							transformOrigin: placement === "bottom" ? "center top" : "center bottom",
						}}
					>
						<Paper>
							<ClickAwayListener onClickAway={handleClose}>
								<MenuList
									id="split-button-menu"
									autoFocusItem
								>
									{options.map((option, index) => (
										<MenuItem
											key={option}
											selected={index === selectedIndex}
											onClick={(event) => handleMenuItemClick(event, index)}
										>
											{option}
										</MenuItem>
									))}
								</MenuList>
							</ClickAwayListener>
						</Paper>
					</Grow>
				)}
			</Popper>
		</React.Fragment>
	);
};

export default MonitorActions;

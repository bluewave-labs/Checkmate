import React, { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Settings from "@/assets/icons/settings-bold.svg?react";

export type ActionMenuItem = {
	id: number | string;
	label: React.ReactNode;
	action: Function;
	closeMenu?: boolean;
};

export const ActionsMenu = ({ items }: { items: ActionMenuItem[] }) => {
	const [anchorEl, setAnchorEl] = useState<null | any>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<any>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<div>
			<IconButton onClick={handleClick}>
				<Settings />
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
			>
				{items.map((item) => (
					<MenuItem
						key={item.id}
						onClick={() => {
							if (item.closeMenu) handleClose();
							item.action();
						}}
					>
						{item.label}
					</MenuItem>
				))}
			</Menu>
		</div>
	);
};

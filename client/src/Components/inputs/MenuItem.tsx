import { forwardRef } from "react";
import MenuItem from "@mui/material/MenuItem";
import type { MenuItemProps } from "@mui/material/MenuItem";

export const MenuItemInput = forwardRef<HTMLLIElement, MenuItemProps>(
	function MenuItemInput(props, ref) {
		return (
			<MenuItem
				{...props}
				ref={ref}
			/>
		);
	}
);

import { forwardRef } from "react";
import Menu from "@mui/material/Menu";
import type { MenuProps } from "@mui/material/Menu";

export const MenuInput = forwardRef<HTMLDivElement, MenuProps>(
	function MenuInput(props, ref) {
		return (
			<Menu
				{...props}
				ref={ref}
			/>
		);
	}
);

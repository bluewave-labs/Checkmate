import { forwardRef } from "react";
import IconButton from "@mui/material/IconButton";
import type { IconButtonProps } from "@mui/material/IconButton";

export const IconButtonInput = forwardRef<HTMLButtonElement, IconButtonProps>(
	function IconButtonInput(props, ref) {
		return (
			<IconButton
				{...props}
				ref={ref}
			/>
		);
	}
);

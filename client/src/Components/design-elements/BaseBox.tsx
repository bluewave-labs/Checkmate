import Box, { type BoxProps } from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { forwardRef } from "react";

export const BaseBox = forwardRef<HTMLDivElement, BoxProps>(({ sx, ...rest }, ref) => {
	const theme = useTheme();
	return (
		<Box
			ref={ref}
			{...rest}
			sx={{
				backgroundColor: theme.palette.background.paper,
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.divider,
				borderRadius: theme.shape.borderRadius,
				...sx,
			}}
		/>
	);
});

BaseBox.displayName = "BaseBox";

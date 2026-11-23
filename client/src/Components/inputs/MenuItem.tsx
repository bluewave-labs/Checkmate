import { forwardRef } from "react";
import MenuItem from "@mui/material/MenuItem";
import type { MenuItemProps } from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

export const MenuItemInput = forwardRef<HTMLLIElement, MenuItemProps>(
	function MenuItemInput({ sx, ...props }, ref) {
		const theme = useTheme();
		const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

		return (
			<MenuItem
				{...props}
				ref={ref}
				sx={[
					{
						fontSize: typographyLevels.base,
						color: theme.palette.text.secondary,
						py: SPACING.XL,
						px: LAYOUT.SM,
						m: SPACING.SM,
						borderRadius: theme.shape.borderRadius,
						"&:hover, &.Mui-selected, &.Mui-selected:hover": {
							backgroundColor: theme.palette.neutral.selectedGreen,
						},
					},
					...additionalSx,
				]}
			/>
		);
	}
);

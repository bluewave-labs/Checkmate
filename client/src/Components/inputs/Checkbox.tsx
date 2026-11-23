import { forwardRef } from "react";
import Checkbox from "@mui/material/Checkbox";
import type { CheckboxProps } from "@mui/material/Checkbox";
import { Square, SquareCheck, SquareMinus } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import Icon from "@/Components/design-elements/Icon";

type CheckboxInputProps = CheckboxProps & {
	label?: string;
};
export const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
	function CheckboxInput(
		{ sx, ...props }: CheckboxInputProps,
		ref: React.Ref<HTMLInputElement>
	) {
		const theme = useTheme();
		return (
			<Checkbox
				{...props}
				aria-label={props.label}
				slotProps={{
					input: {
						ref: ref,
					},
				}}
				icon={<Icon icon={Square} />}
				checkedIcon={<Icon icon={SquareCheck} />}
				indeterminateIcon={<Icon icon={SquareMinus} />}
				sx={{
					color: theme.palette.text.secondary,
					"&.Mui-checked, &.MuiCheckbox-indeterminate": {
						color: theme.palette.primary.main,
					},
					"&:hover": { backgroundColor: "transparent" },
					"& svg": {
						stroke: "currentColor",
					},
					"& svg path, & svg line, & svg polyline, & svg rect": {
						stroke: "currentColor",
						fill: "none",
					},

					...sx,
				}}
			/>
		);
	}
);

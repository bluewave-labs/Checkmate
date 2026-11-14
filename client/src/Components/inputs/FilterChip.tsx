import { useState } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Check, ChevronDown } from "lucide-react";
import { typographyLevels } from "@/Utils/Theme/Palette";
import {
	CONTROL_HEIGHT,
	FILTER_MENU_MIN_WIDTH,
	FOCUS_RING,
	FONT_WEIGHT,
	GAP,
	ICON_SIZE,
	ICON_STROKE,
	PADDING,
	RADIUS,
} from "@/Utils/Theme/constants";

export interface FilterChipOption {
	value: string;
	label: string;
	// Optional custom rendering inside the menu (e.g. a coloured tag label)
	content?: React.ReactNode;
}

interface FilterChipBaseProps {
	label: string;
	anyLabel: string;
	options: FilterChipOption[];
}

interface SingleProps extends FilterChipBaseProps {
	multiple?: false;
	value: string;
	onChange: (value: string) => void;
}

interface MultipleProps extends FilterChipBaseProps {
	multiple: true;
	value: string[];
	onChange: (value: string[]) => void;
}

// One chip per filterable column (VerifyWise filter chips). Presentation only:
// it reports the chosen value(s) through onChange exactly as a Select would.
export const FilterChip = (props: SingleProps | MultipleProps) => {
	const theme = useTheme();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const { label, anyLabel, options } = props;

	const selected = props.multiple ? props.value : props.value ? [props.value] : [];
	const isSet = selected.length > 0;
	const selectedLabels = options
		.filter((option) => selected.includes(option.value))
		.map((option) => option.label);
	const valueText = !isSet
		? anyLabel
		: selectedLabels.length > 2
			? `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`
			: selectedLabels.join(", ");

	const handleSelect = (value: string) => {
		if (props.multiple) {
			const next = props.value.includes(value)
				? props.value.filter((v) => v !== value)
				: [...props.value, value];
			props.onChange(next);
			return;
		}
		props.onChange(value);
		setAnchor(null);
	};

	return (
		<>
			<ButtonBase
				onClick={(event) => setAnchor(event.currentTarget)}
				aria-haspopup="menu"
				aria-expanded={Boolean(anchor)}
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: GAP.CHIP,
					height: CONTROL_HEIGHT.CHIP,
					padding: PADDING.CHIP,
					borderRadius: RADIUS.PILL,
					border: `1px solid ${isSet ? theme.palette.primary.main : theme.palette.neutral.hairline}`,
					backgroundColor: isSet
						? theme.palette.neutral.hoverGreen
						: theme.palette.background.paper,
					color: theme.palette.text.primary,
					fontSize: typographyLevels.sm,
					whiteSpace: "nowrap",
					transition: "background-color 150ms ease, border-color 150ms ease",
					"&:hover": {
						backgroundColor: isSet
							? theme.palette.neutral.hoverGreen
							: theme.palette.neutral.raised,
						borderColor: isSet
							? theme.palette.primary.main
							: theme.palette.neutral.border,
					},
					"&.Mui-focusVisible": {
						outline: `${FOCUS_RING.WIDTH}px solid ${theme.palette.primary.main}`,
						outlineOffset: FOCUS_RING.OFFSET,
					},
				}}
			>
				<Box component="span">
					{label}:{" "}
					<Box
						component="span"
						fontWeight={isSet ? FONT_WEIGHT.MEDIUM : FONT_WEIGHT.REGULAR}
					>
						{valueText}
					</Box>
				</Box>
				<ChevronDown
					size={ICON_SIZE.SM}
					strokeWidth={ICON_STROKE}
					color={theme.palette.neutral.icon}
				/>
			</ButtonBase>
			<Menu
				anchorEl={anchor}
				open={Boolean(anchor)}
				onClose={() => setAnchor(null)}
				slotProps={{ paper: { sx: { minWidth: FILTER_MENU_MIN_WIDTH } } }}
			>
				{options.map((option) => {
					const isSelected = selected.includes(option.value);
					return (
						<MenuItem
							key={option.value}
							selected={isSelected}
							onClick={() => handleSelect(option.value)}
							sx={{ gap: theme.spacing(4), justifyContent: "space-between" }}
						>
							<Box
								component="span"
								fontSize={typographyLevels.base}
							>
								{option.content ?? option.label}
							</Box>
							{isSelected && (
								<Check
									size={ICON_SIZE.SM}
									strokeWidth={ICON_STROKE}
									color={theme.palette.primary.main}
								/>
							)}
						</MenuItem>
					);
				})}
			</Menu>
		</>
	);
};

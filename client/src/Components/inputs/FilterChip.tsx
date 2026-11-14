import { useId, useState } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Check, ChevronDown } from "lucide-react";
import { typographyLevels } from "@/Utils/Theme/Palette";
import {
	FILTER_MENU_MIN_WIDTH,
	FOCUS_RING,
	FONT_WEIGHT,
	GAP,
	ICON_SIZE,
	ICON_STROKE,
	INPUT_BASE_HEIGHT,
	MOTION,
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

// Selected values listed in the chip before collapsing the rest into "+N"
const MAX_VISIBLE_VALUES = 2;

// One filter per column, shown as "Label: value". It is
// sized and bordered exactly like the dropdowns elsewhere (34px, 2px corners,
// input border) so filter rows match across pages. Presentation only: it reports
// the chosen value(s) through onChange exactly as a Select would.
export const FilterChip = (props: SingleProps | MultipleProps) => {
	const theme = useTheme();
	const menuId = useId();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const { label, anyLabel, options } = props;

	const selected = props.multiple ? props.value : props.value ? [props.value] : [];
	const isSet = selected.length > 0;
	const selectedLabels = options
		.filter((option) => selected.includes(option.value))
		.map((option) => option.label);
	const hiddenCount = selectedLabels.length - MAX_VISIBLE_VALUES;
	const valueText = !isSet
		? anyLabel
		: hiddenCount > 0
			? `${selectedLabels.slice(0, MAX_VISIBLE_VALUES).join(", ")} +${hiddenCount}`
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
				aria-controls={anchor ? menuId : undefined}
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: GAP.CHIP,
					height: INPUT_BASE_HEIGHT,
					padding: PADDING.CHIP,
					borderRadius: RADIUS.SM,
					border: `1px solid ${isSet ? theme.palette.primary.main : theme.palette.neutral.border}`,
					backgroundColor: isSet
						? theme.palette.neutral.hoverGreen
						: theme.palette.background.paper,
					color: theme.palette.text.primary,
					fontSize: typographyLevels.base,
					whiteSpace: "nowrap",
					transition: `background-color ${MOTION.HOVER}, border-color ${MOTION.HOVER}`,
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
				id={menuId}
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
							role={props.multiple ? "menuitemcheckbox" : "menuitemradio"}
							aria-checked={isSelected}
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

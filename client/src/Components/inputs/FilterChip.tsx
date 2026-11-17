import { useId, useState } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Check, ChevronDown } from "lucide-react";
import { Menu, MenuItem } from "@/Components/inputs";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { INPUT_BASE_HEIGHT, LAYOUT } from "@/Utils/Theme/constants";

const FILTER_MENU_MIN_WIDTH = 180;
const MAX_VISIBLE_VALUES = 2;

export interface FilterChipOption {
	value: string;
	label: string;
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
					gap: LAYOUT.XXS,
					height: INPUT_BASE_HEIGHT,
					pl: LAYOUT.SM,
					pr: LAYOUT.XS_PLUS,
					borderRadius: theme.shape.borderRadius,
					border: `1px solid ${isSet ? theme.palette.primary.main : theme.palette.neutral.border}`,
					backgroundColor: isSet
						? theme.palette.neutral.hoverGreen
						: theme.palette.background.paper,
					color: theme.palette.text.primary,
					fontSize: typographyLevels.base,
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
						outline: `2px solid ${theme.palette.primary.main}`,
						outlineOffset: 1,
					},
				}}
			>
				<Box component="span">
					{label}:{" "}
					<Box
						component="span"
						fontWeight={isSet ? 500 : 400}
					>
						{valueText}
					</Box>
				</Box>
				<ChevronDown
					size={14}
					strokeWidth={1.5}
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
							sx={{ gap: LAYOUT.XS, justifyContent: "space-between" }}
						>
							<Box
								component="span"
								fontSize={typographyLevels.base}
							>
								{option.content ?? option.label}
							</Box>
							{isSelected && (
								<Check
									size={14}
									strokeWidth={1.5}
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

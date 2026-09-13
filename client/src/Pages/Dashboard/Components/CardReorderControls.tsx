import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown } from "lucide-react";

import { Icon, Tooltip } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";

// Snug around the 16px icon without inflating the card header.
const CONTROL_SIZE = 24;
const ICON_SIZE = 16;

/**
 * Move-up / move-down controls, revealed on hover over the card they belong to.
 * Kept out of DashboardCard so the 17 card components stay unaware of their own
 * position — the grid owns ordering.
 */
export const CardReorderControls = ({
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}: {
	onMoveUp: () => void;
	onMoveDown: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const buttonSx = {
		width: CONTROL_SIZE,
		height: CONTROL_SIZE,
		borderRadius: theme.shape.borderRadius,
		color: theme.palette.text.secondary,
		"&:hover": {
			backgroundColor: theme.palette.action.hover,
			color: theme.palette.text.primary,
		},
		"&.Mui-disabled": { color: theme.palette.text.disabled },
	};

	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(LAYOUT.XXS)}
			p={theme.spacing(LAYOUT.XXS)}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.background.paper}
			border={`1px solid ${theme.palette.divider}`}
		>
			<Tooltip title={t("pages.dashboard.reorder.moveUp")}>
				{/* span keeps the tooltip working while the button is disabled */}
				<span>
					<IconButton
						size="small"
						disabled={!canMoveUp}
						onClick={onMoveUp}
						aria-label={t("pages.dashboard.reorder.moveUp")}
						sx={buttonSx}
					>
						<Icon
							icon={ChevronUp}
							size={ICON_SIZE}
						/>
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title={t("pages.dashboard.reorder.moveDown")}>
				<span>
					<IconButton
						size="small"
						disabled={!canMoveDown}
						onClick={onMoveDown}
						aria-label={t("pages.dashboard.reorder.moveDown")}
						sx={buttonSx}
					>
						<Icon
							icon={ChevronDown}
							size={ICON_SIZE}
						/>
					</IconButton>
				</span>
			</Tooltip>
		</Stack>
	);
};

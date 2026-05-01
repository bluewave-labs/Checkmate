import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import { Play, Pause } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";

interface BulkActionsBarProps {
	selectedCount: number;
	onResume: () => void;
	onPause: () => void;
	onCancel: () => void;
}

export const BulkActionsBar = ({
	selectedCount,
	onResume,
	onPause,
	onCancel,
}: BulkActionsBarProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<Collapse in={selectedCount > 0}>
			<Box
				p={theme.spacing(2, 4)}
				bgcolor={theme.palette.action.hover}
				borderRadius={1}
				border={1}
				borderColor={theme.palette.divider}
				sx={{ borderStyle: "dashed" }}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
				>
					<Typography variant="body2">
						{t("pages.common.monitors.actions.bulkSelected", {
							count: selectedCount,
						})}
					</Typography>
					<Stack
						direction="row"
						gap={theme.spacing(2)}
					>
						<Button
							size="small"
							startIcon={<Play size={16} />}
							onClick={onResume}
						>
							{t("common.buttons.resume")}
						</Button>
						<Button
							size="small"
							startIcon={<Pause size={16} />}
							onClick={onPause}
						>
							{t("common.buttons.pause")}
						</Button>
						<Button
							size="small"
							variant="text"
							color="inherit"
							onClick={onCancel}
						>
							{t("common.buttons.cancel")}
						</Button>
					</Stack>
				</Stack>
			</Box>
		</Collapse>
	);
};

import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import { X } from "lucide-react";

interface FloatingActionBarProps {
	selectedCount: number;
	onClearSelection: () => void;
	children?: React.ReactNode;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
	selectedCount,
	onClearSelection,
	children,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isOpen = selectedCount > 0;

	return (
		<Slide
			direction="up"
			in={isOpen}
			mountOnEnter
			unmountOnExit
		>
			<Paper
				elevation={6}
				sx={{
					position: "fixed",
					bottom: theme.spacing(4),
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: theme.zIndex.snackbar,
					padding: theme.spacing(1.5, 3),
					borderRadius: theme.shape.borderRadius,
					backgroundColor: theme.palette.background.paper,
					border: `1px solid ${theme.palette.divider}`,
					display: "flex",
					alignItems: "center",
					gap: theme.spacing(4),
					boxShadow: theme.shadows[8],
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(1)}
				>
					<Typography
						variant="body1"
						fontWeight={600}
						color={theme.palette.text.primary}
					>
						{selectedCount} {t("common.selected", { defaultValue: "selected" })}
					</Typography>
					<IconButton
						size="small"
						onClick={onClearSelection}
						aria-label="clear selection"
					>
						<X size={18} />
					</IconButton>
				</Stack>

				{children && (
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						{children}
					</Stack>
				)}
			</Paper>
		</Slide>
	);
};

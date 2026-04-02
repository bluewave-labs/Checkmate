import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import { X } from "lucide-react";
import { LAYOUT } from "@/Utils/Theme/constants";

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
					bottom: theme.spacing(LAYOUT.XS),
					left: 0,
					right: 0,
					margin: "0 auto",
					width: "max-content",
					zIndex: theme.zIndex.snackbar,
					px: LAYOUT.MD,
					py: LAYOUT.XS,
					borderRadius: theme.shape.borderRadius,
					backgroundColor: theme.palette.background.paper,
					border: `1px solid ${theme.palette.divider}`,
					display: "flex",
					alignItems: "center",
					gap: LAYOUT.XS,
					boxShadow: theme.shadows[8],
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={LAYOUT.XS}
				>
					<Typography
						variant="body1"
						fontWeight={600}
						color={theme.palette.text.primary}
					>
						{selectedCount} {t("common.selected")}
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
						gap={LAYOUT.XS}
					>
						{children}
					</Stack>
				)}
			</Paper>
		</Slide>
	);
};

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Slide from "@mui/material/Slide";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { LAYOUT } from "@/Utils/Theme/constants";
import { useSidebar } from "@/Hooks/useSidebar";

interface BulkActionsBarProps {
	selectedCount: number;
	onCancel: () => void;
	children?: React.ReactNode;
	hidden?: boolean;
}

export const BulkActionsBar = ({
	selectedCount,
	onCancel,
	children,
	hidden = false,
}: BulkActionsBarProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isOpen = selectedCount > 0 && !hidden;

	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { width, collapsedWidth, transition } = useSidebar();

	const sidebarOffset = isSmall ? collapsedWidth : width;

	return (
		<Box
			display="flex"
			sx={{
				position: "fixed",
				bottom: theme.spacing(LAYOUT.XS),
				left: sidebarOffset,
				right: sidebarOffset,
				justifyContent: "center",
				pointerEvents: "none",
				zIndex: theme.zIndex.snackbar,
				transition:
					transition.replace("width", "left") +
					", " +
					transition.replace("width", "right"),
			}}
		>
			<Slide
				direction="up"
				in={isOpen}
				mountOnEnter
				unmountOnExit
			>
				<Box
					component={Paper as any}
					elevation={6}
					px={LAYOUT.MD}
					py={LAYOUT.XS}
					borderRadius={theme.shape.borderRadius}
					bgcolor={theme.palette.background.paper}
					border={`1px solid ${theme.palette.divider}`}
					display="flex"
					gap={LAYOUT.XS}
					maxWidth={isSmall ? `calc(100vw - ${theme.spacing(LAYOUT.XS)})` : "none"}
					sx={{
						pointerEvents: "auto",
						flexWrap: "wrap",
						justifyContent: "center",
						alignItems: "center",
						boxShadow: theme.shadows[8],
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						gap={LAYOUT.XXS}
					>
						<Typography
							variant="body1"
							fontWeight={600}
							color={theme.palette.text.primary}
						>
							{t("pages.common.monitors.actions.bulkSelected", {
								count: selectedCount,
							})}
						</Typography>
						<IconButton
							size="small"
							onClick={onCancel}
							aria-label={t("common.buttons.cancel")}
						>
							<X size={18} />
						</IconButton>
					</Stack>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="center"
						gap={LAYOUT.XXS}
						flexWrap="wrap"
					>
						{children}
					</Stack>
				</Box>
			</Slide>
		</Box>
	);
};

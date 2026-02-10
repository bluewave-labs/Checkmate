import { Typography, IconButton, Stack, Box } from "@mui/material";
import { Icon } from "@/Components/v2/design-elements";
import { X } from "lucide-react";

import { useTheme } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { setStarPromptOpen } from "@/Features/UI/uiSlice.js";
import type { RootState } from "@/Types/state.js";
import useSidebar from "@/Hooks/useSidebar.js";

export const StarPrompt = ({
	repoUrl = "https://github.com/bluewave-labs/checkmate",
}: {
	repoUrl?: string;
}) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const isOpen = useSelector((state: RootState) => state.ui?.starPromptOpen ?? true);
	const mode = useSelector((state: RootState) => state.ui.mode);
	const { collapsed } = useSidebar();
	const handleClose = () => {
		dispatch(setStarPromptOpen(false));
	};

	const handleStarClick = () => {
		window.open(repoUrl, "_blank");
	};

	if (collapsed) return null;
	if (!isOpen) return null;

	return (
		<Stack
			direction="column"
			sx={{
				width: "100%",
				padding: `${theme.spacing(6)} ${theme.spacing(6)}`,
				borderTop: `1px solid ${theme.palette.divider}`,
				borderBottom: `1px solid ${theme.palette.divider}`,
				borderRadius: 0,
				gap: theme.spacing(1.5),
			}}
		>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				width="100%"
				pl={theme.spacing(4)}
			>
				<Typography
					variant="subtitle2"
					mt={theme.spacing(3)}
				>
					{t("components.sidebar.starPrompt.title")}
				</Typography>
				<IconButton
					onClick={handleClose}
					size="small"
					sx={{
						color: theme.palette.text.primary,
						padding: 0,
						"&:hover": {
							backgroundColor: "transparent",
							opacity: 0.8,
						},
					}}
				>
					<Icon
						icon={X}
						size={20}
					/>
				</IconButton>
			</Stack>

			<Typography
				sx={{
					mb: 1,
					px: theme.spacing(4),
				}}
			>
				{t("components.sidebar.starPrompt.description")}
			</Typography>

			<Box
				component="img"
				src={`https://img.shields.io/github/stars/bluewave-labs/checkmate?label=checkmate&style=social${mode === "dark" ? "&color=white" : ""}`}
				alt="GitHub stars"
				onClick={handleStarClick}
				sx={{
					cursor: "pointer",
					transform: "scale(0.65)",
					transformOrigin: "left center",
					"&:hover": {
						opacity: 0.8,
					},
					pl: theme.spacing(4),
					filter: mode === "dark" ? "invert(1)" : "none",
				}}
			/>
		</Stack>
	);
};

import Stack, { type StackProps } from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { toggleSidebar } from "@/Features/UI/uiSlice.js";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import useSidebar from "@/Hooks/useSidebar";
import KingIcon from "@/assets/icons/checkmate-icon.svg?react";

export const Logo = (props: StackProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useDispatch();
	const { collapsed } = useSidebar();
	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(4)}
			onClick={() => {
				dispatch(toggleSidebar());
			}}
			sx={{ cursor: "pointer" }}
			{...props}
		>
			<Box
				sx={{
					width: theme.spacing(16),
					height: theme.spacing(16),
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					"& svg": {
						width: "100%",
						height: "100%",
					},
				}}
			>
				<KingIcon />
			</Box>
			<Box
				overflow={"hidden"}
				sx={{
					transition: "opacity 900ms ease, width 900ms ease",
					opacity: collapsed ? 0 : 1,
					whiteSpace: "nowrap",
					width: collapsed ? 0 : "100%",
				}}
			>
				{" "}
				<Typography
					lineHeight={1}
					mt={theme.spacing(2)}
					variant="h2"
					fontWeight={500}
				>
					{t("common.appName")}
				</Typography>
			</Box>
		</Stack>
	);
};

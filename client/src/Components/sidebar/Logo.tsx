import Stack, { type StackProps } from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Icon } from "@/Components/design-elements";
import { SPACING } from "@/Utils/Theme/constants";
import { toggleSidebar } from "@/Features/UI/uiSlice.js";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import useSidebar from "@/Hooks/useSidebar";
import KingIcon from "@/assets/icons/checkmate-icon.svg?react";

const ToggleButton = ({ expand, sx }: { expand: boolean; sx?: object }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useDispatch();
	const { collapsed, transitionTiming } = useSidebar();
	const visible = expand === collapsed;
	const label = expand
		? t("components.sidebar.toggle.expand")
		: t("components.sidebar.toggle.collapse");
	return (
		<Tooltip
			placement="right"
			title={label}
			disableInteractive
		>
			<IconButton
				onClick={() => dispatch(toggleSidebar())}
				aria-label={label}
				aria-hidden={!visible}
				tabIndex={visible ? 0 : -1}
				sx={{
					// IconButton is not a MUI system component, so these cannot be hoisted to props
					flexShrink: 0,
					opacity: visible ? 1 : 0,
					visibility: visible ? "visible" : "hidden",
					transition: `opacity ${transitionTiming}, visibility ${transitionTiming}`,
					"&:focus": { outline: "none" },
					"& svg": { stroke: theme.palette.text.secondary },
					...sx,
				}}
			>
				<Icon
					icon={expand ? PanelLeftOpen : PanelLeftClose}
					size={18}
				/>
			</IconButton>
		</Tooltip>
	);
};

export const Logo = (props: StackProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { collapsed, transitionTiming } = useSidebar();
	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(SPACING.MD)}
			overflow="hidden"
			{...props}
		>
			<Box
				position="relative"
				flexShrink={0}
				width={theme.spacing(16)}
				height={theme.spacing(16)}
			>
				<Box
					width="100%"
					height="100%"
					display="flex"
					justifyContent="center"
					alignItems="center"
					sx={{
						opacity: collapsed ? 0 : 1,
						transition: `opacity ${transitionTiming}`,
						"& svg": {
							width: "100%",
							height: "100%",
						},
					}}
				>
					<KingIcon />
				</Box>
				<ToggleButton
					expand
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				/>
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
			<ToggleButton
				expand={false}
				sx={{ marginLeft: "auto" }}
			/>
		</Stack>
	);
};

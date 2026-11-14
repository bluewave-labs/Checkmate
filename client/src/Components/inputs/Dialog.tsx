import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { X } from "lucide-react";
import { Button } from "@/Components/inputs";
import { useTheme } from "@mui/material/styles";
import {
	FONT_WEIGHT,
	ICON_SIZE,
	ICON_STROKE,
	LAYOUT,
	LINE_HEIGHT,
	PADDING,
	RADIUS,
} from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

// Sizing stays with MUI and each caller's maxWidth / fullWidth

export const DialogInput = ({
	open,
	title,
	content,
	onConfirm,
	onCancel,
	confirmColor = "primary",
	loading = false,
	cancelText,
	confirmText,
	children,
	maxWidth,
	fullWidth = false,
	additionalButtons,
	framed = true,
}: {
	open: boolean;
	title?: string;
	content?: string;
	onConfirm?(item: any): any;
	onCancel?(item: any): any;
	confirmColor?: "error" | "primary";
	loading?: boolean;
	cancelText?: string;
	confirmText?: string;
	children?: ReactNode;
	maxWidth?: DialogProps["maxWidth"];
	fullWidth?: boolean;
	additionalButtons?: ReactNode;
	// Turn off when the content brings its own cards
	framed?: boolean;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<Dialog
			open={open}
			maxWidth={maxWidth}
			fullWidth={fullWidth}
			onClose={(_event, reason) => {
				if (reason !== "backdropClick" && onCancel) onCancel(undefined);
			}}
			slotProps={{
				paper: {
					sx: {
						backgroundColor: theme.palette.background.default,
						borderRadius: RADIUS.SM,
					},
				},
			}}
		>
			{title && (
				<DialogTitle
					component="div"
					display="flex"
					alignItems="flex-start"
					justifyContent="space-between"
					gap={theme.spacing(LAYOUT.MD)}
					padding={PADDING.DIALOG_SECTION}
					borderBottom={`1px solid ${theme.palette.neutral.hairline}`}
				>
					<Box>
						<Typography
							component="h2"
							fontSize={typographyLevels.l}
							fontWeight={FONT_WEIGHT.SEMIBOLD}
							lineHeight={LINE_HEIGHT.TITLE}
							color={theme.palette.text.primary}
						>
							{title}
						</Typography>
						{content && (
							<Typography
								variant="body1"
								color={theme.palette.text.secondary}
								mt={theme.spacing(LAYOUT.XXS)}
							>
								{content}
							</Typography>
						)}
					</Box>
					{onCancel && (
						<IconButton
							aria-label={t("common.buttons.close")}
							onClick={onCancel}
							sx={{
								padding: PADDING.ICON_BUTTON,
								mt: theme.spacing(-1),
								color: theme.palette.neutral.icon,
								"&:hover": { backgroundColor: theme.palette.neutral.raised },
							}}
						>
							<X
								size={ICON_SIZE.MD}
								strokeWidth={ICON_STROKE}
							/>
						</IconButton>
					)}
				</DialogTitle>
			)}
			{children && (
				<DialogContent
					sx={{
						padding: PADDING.DIALOG_SECTION,
						// MUI drops top padding after a title; keep the gap below the header line
						".MuiDialogTitle-root + &": { paddingTop: PADDING.DIALOG_SECTION_TOP },
					}}
				>
					{framed ? (
						<Box
							bgcolor={theme.palette.background.paper}
							border={`1px solid ${theme.palette.neutral.hairline}`}
							borderRadius={RADIUS.SM}
							padding={PADDING.DIALOG_BOX}
						>
							{children}
						</Box>
					) : (
						children
					)}
				</DialogContent>
			)}
			<DialogActions
				sx={{
					padding: PADDING.DIALOG_FOOTER,
					gap: theme.spacing(LAYOUT.XS),
					borderTop: `1px solid ${theme.palette.neutral.hairline}`,
					"& > :not(style) ~ :not(style)": { marginLeft: 0 },
				}}
			>
				<Button
					loading={loading}
					variant="outlined"
					onClick={onCancel}
				>
					{cancelText ?? t("common.buttons.cancel")}
				</Button>
				{additionalButtons}
				{onConfirm && (
					<Button
						loading={loading}
						variant="contained"
						color={confirmColor}
						onClick={onConfirm}
					>
						{confirmText ?? t("common.buttons.confirm")}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

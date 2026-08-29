import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { SxProps } from "@mui/material/styles";
import type { ReactNode } from "react";

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
	cancelSx,
	onEscape,
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
	/** Styles the cancel button — e.g. an auto margin to push it left. */
	cancelSx?: SxProps;
	/**
	 * Called when Escape is pressed. Defaults to `onCancel`, which is right when
	 * cancel simply dismisses — but not when it does something else, so a dialog
	 * whose cancel slot carries another action passes its own dismiss here.
	 */
	onEscape?(): void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<Dialog
			open={open}
			maxWidth={maxWidth}
			fullWidth={fullWidth}
			onClose={(_event, reason) => {
				if (reason === "backdropClick") return;
				if (onEscape) {
					onEscape();
					return;
				}
				if (onCancel) onCancel(undefined);
			}}
		>
			{title && (
				<DialogTitle
					pb={theme.spacing(LAYOUT.XS)}
					bgcolor={theme.palette.action.hover}
					borderBottom={`1px solid ${theme.palette.divider}`}
				>
					<Typography
						component="span"
						variant="h2"
						fontWeight={600}
						display={"block"}
					>
						{title}
					</Typography>
					{content && (
						<Typography
							variant="body1"
							color={theme.palette.text.secondary}
							mt={theme.spacing(LAYOUT.XS)}
							display={"block"}
						>
							{content}
						</Typography>
					)}
				</DialogTitle>
			)}
			{children && (
				<DialogContent sx={{ pt: theme.spacing(LAYOUT.MD) }}>
					<Box pt={theme.spacing(LAYOUT.XS)}>{children}</Box>
				</DialogContent>
			)}
			<DialogActions
				sx={{
					p: theme.spacing(LAYOUT.MD),
					pt: theme.spacing(LAYOUT.SM),
					backgroundColor: theme.palette.action.hover,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Button
					loading={loading}
					variant="outlined"
					onClick={onCancel}
					sx={cancelSx}
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

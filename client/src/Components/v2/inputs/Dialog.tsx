import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Button } from "@/Components/v2/inputs";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

export const DialogInput = ({
	open,
	title,
	content,
	onConfirm,
	onCancel,
	confirmColor = "primary",
	cancelColor = "error",
	loading = false,
	cancelText,
	confirmText,
	children,
	maxWidth,
	fullWidth = false,
	additionalButtons,
}: {
	open: boolean;
	title?: string;
	content?: string;
	onConfirm?(item: any): any;
	onCancel?(item: any): any;
	confirmColor?: "error" | "primary";
	cancelColor?: "error" | "primary";
	loading?: boolean;
	cancelText?: string;
	confirmText?: string;
	children?: ReactNode;
	maxWidth?: DialogProps["maxWidth"];
	fullWidth?: boolean;
	additionalButtons?: ReactNode;
}) => {
	const { t } = useTranslation();
	return (
		<Dialog
			open={open}
			maxWidth={maxWidth}
			fullWidth={fullWidth}
		>
			{title && <DialogTitle sx={{ fontSize: typographyLevels.l }}>{title}</DialogTitle>}
			<DialogContent>
				{content && <DialogContentText>{content}</DialogContentText>}
				{children}
			</DialogContent>
			<DialogActions>
				<Button
					loading={loading}
					variant="contained"
					color={cancelColor}
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

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Button } from "@/Components/v2/inputs";
import { typographyLevels } from "@/Utils/Theme/v2Palette";
import { useTranslation } from "react-i18next";

export const DialogInput = ({
	open,
	title,
	content,
	onConfirm,
	onCancel,
	confirmColor = "primary",
	cancelColor = "error",
	loading = false,
}: {
	open: boolean;
	title?: string;
	content?: string;
	onConfirm?(item: any): any;
	onCancel?(item: any): any;
	confirmColor?: "error" | "primary";
	cancelColor?: "error" | "primary";
	loading?: boolean;
}) => {
	const { t } = useTranslation();
	return (
		<Dialog open={open}>
			<DialogTitle sx={{ fontSize: typographyLevels.l }}>{title}</DialogTitle>
			<DialogContent>
				<DialogContentText>{content}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button
					loading={loading}
					variant="contained"
					color={cancelColor}
					onClick={onCancel}
				>
					{t("common.buttons.cancel")}
				</Button>
				<Button
					loading={loading}
					variant="contained"
					color={confirmColor}
					onClick={onConfirm}
				>
					{t("common.buttons.confirm")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

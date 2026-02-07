import { useId } from "react";
import { Modal, Stack, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Button } from "@/Components/v2/inputs";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	onConfirm: () => void;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
	confirmColor?: "error" | "primary" | "secondary" | "success" | "warning" | "info";
}

export const ConfirmDialog = ({
	open,
	onClose,
	title,
	description,
	onConfirm,
	confirmText,
	cancelText,
	isLoading = false,
	confirmColor = "error",
}: ConfirmDialogProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const titleId = useId();
	const descriptionId = useId();

	return (
		<Modal
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
			open={open}
			onClose={onClose}
			onClick={(e) => e.stopPropagation()}
		>
			<Stack
				gap={2}
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					minWidth: 400,
					maxWidth: 500,
					backgroundColor: theme.palette.background.paper,
					border: 1,
					borderColor: theme.palette.divider,
					borderRadius: 1,
					boxShadow: 24,
					p: 4,
					"&:focus": {
						outline: "none",
					},
				}}
			>
				<Typography
					id={titleId}
					variant="h6"
					fontWeight={600}
				>
					{title}
				</Typography>
				{description && (
					<Typography
						id={descriptionId}
						color="text.secondary"
					>
						{description}
					</Typography>
				)}
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 2,
						mt: 2,
					}}
				>
					<Button
						variant="outlined"
						onClick={onClose}
						disabled={isLoading}
					>
						{cancelText ?? t("common.buttons.cancel")}
					</Button>
					<Button
						variant="contained"
						color={confirmColor}
						onClick={onConfirm}
						loading={isLoading}
					>
						{confirmText ?? t("common.buttons.confirm")}
					</Button>
				</Box>
			</Stack>
		</Modal>
	);
};

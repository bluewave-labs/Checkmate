import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { X } from "lucide-react";
import { Button, IconButton } from "@/Components/inputs";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import Icon from "@/Components/design-elements/Icon";

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
				paper: { sx: { backgroundColor: theme.palette.background.default } },
			}}
		>
			{title && (
				<DialogTitle
					component="div"
					display="flex"
					alignItems="flex-start"
					justifyContent="space-between"
					gap={LAYOUT.MD}
					py={LAYOUT.MD}
					px={LAYOUT.XL}
					borderBottom={`1px solid ${theme.palette.neutral.hairline}`}
				>
					<Box>
						<Typography
							variant="h2"
							color={theme.palette.text.primary}
						>
							{title}
						</Typography>
						{content && (
							<Typography
								variant="body1"
								color={theme.palette.text.secondary}
								mt={LAYOUT.XXS}
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
								p: LAYOUT.XXS,
								mt: -SPACING.SM,
								color: theme.palette.neutral.icon,
								"&:hover": { backgroundColor: theme.palette.neutral.raised },
							}}
						>
							<Icon icon={X} />
						</IconButton>
					)}
				</DialogTitle>
			)}
			{children && (
				<DialogContent
					sx={{
						py: LAYOUT.MD,
						px: LAYOUT.XL,
						".MuiDialogTitle-root + &": { pt: LAYOUT.MD },
					}}
				>
					{framed ? (
						<Box
							bgcolor={theme.palette.background.paper}
							border={`1px solid ${theme.palette.neutral.hairline}`}
							borderRadius={theme.shape.borderRadius}
							p={LAYOUT.LG}
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
					py: LAYOUT.SM,
					px: LAYOUT.XL,
					gap: LAYOUT.XS,
					borderTop: `1px solid ${theme.palette.neutral.hairline}`,
					"& > :not(style) ~ :not(style)": { ml: 0 },
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

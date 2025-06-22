import PropTypes from "prop-types";
import { Button, Stack } from "@mui/material";
import { GenericDialog } from "./genericDialog";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const Dialog = ({
	title,
	description,
	open,
	onCancel,
	confirmationButtonLabel,
	onConfirm,
	isLoading,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<GenericDialog
			title={title}
			description={description}
			open={open}
			onClose={onCancel}
			theme={theme}
		>
			<Stack
				direction="row"
				gap={theme.spacing(4)}
				mt={theme.spacing(12)}
				justifyContent="flex-end"
			>
				<Button
					variant="contained"
					color="secondary"
					onClick={onCancel}
				>
					{t("cancel", "Cancel")}
				</Button>
				<Button
					variant="contained"
					color="error"
					loading={isLoading}
					onClick={onConfirm}
				>
					{confirmationButtonLabel}
				</Button>
			</Stack>
		</GenericDialog>
	);
};

Dialog.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	open: PropTypes.bool.isRequired,
	onCancel: PropTypes.func.isRequired,
	confirmationButtonLabel: PropTypes.string.isRequired,
	onConfirm: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
};

export default Dialog;

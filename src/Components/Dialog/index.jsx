import PropTypes from "prop-types";
import { Button, Stack } from "@mui/material";
import { GenericDialog } from "./genericDialog";
import { useTheme } from "@emotion/react";

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
					onClick={onCancel}
					sx={{
						"&:hover": {
							backgroundColor: theme.palette.primary.lowContrast,
						},
					}}
				>
					Cancel
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
	isLoading: PropTypes.bool.isRequired,
};

export default Dialog;

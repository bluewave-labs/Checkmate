import { useId } from "react";
import PropTypes from "prop-types";
import { Modal, Stack, Typography } from "@mui/material";

const GenericDialog = ({ title, description, open, onClose, theme, children }) => {
	const titleId = useId();
	const descriptionId = useId();
	const ariaDescribedBy = description?.length > 0 ? descriptionId : "";
	return (
		<Modal
			aria-labelledby={titleId}
			aria-describedby={ariaDescribedBy}
			open={open}
			onClose={onClose}
			onClick={(e) => e.stopPropagation()}
		>
			<Stack
				gap={theme.spacing(2)}
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: 400,
					bgcolor: theme.palette.primary.main,
					border: 1,
					borderColor: theme.palette.primary.lowContrast,
					borderRadius: theme.shape.borderRadius,
					boxShadow: 24,
					p: theme.spacing(15),
					"&:focus": {
						outline: "none",
					},
				}}
			>
				<Typography
					id={titleId}
					component="h2"
					fontSize={16}
					color={theme.palette.primary.contrastText}
					fontWeight={600}
				>
					{title}
				</Typography>
				{description && (
					<Typography
						id={descriptionId}
						color={theme.palette.primary.contrastTextTertiary}
					>
						{description}
					</Typography>
				)}
				{children}
			</Stack>
		</Modal>
	);
};

GenericDialog.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	theme: PropTypes.object.isRequired,
	children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
		.isRequired,
};

export { GenericDialog };

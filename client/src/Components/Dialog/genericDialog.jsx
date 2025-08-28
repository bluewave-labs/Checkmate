import { useId } from "react";
import PropTypes from "prop-types";
import { Modal, Stack, Typography } from "@mui/material";

const GenericDialog = ({ title, description, open, onClose, theme, children, width }) => {
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
				width={width}
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					minWidth: 400,
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
					marginBottom={theme.spacing(4)}
				>
					{title}
				</Typography>
				{description && (
					<Typography
						id={descriptionId}
						color={theme.palette.primary.contrastTextTertiary}
						marginBottom={theme.spacing(4)}
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
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export { GenericDialog };

import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import { Box, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import "./index.css";

/**
 * @param {Object} props - The component props.
 * @param {JSX.Element} props.icon - The icon element to display (optional).
 * @param {string} props.label - The label text for the progress item.
 * @param {string} props.size - The size information for the progress item.
 * @param {number} props.progress - The current progress value (0-100).
 * @param {function} props.onClick - The function to handle click events on the remove button.
 * @param {string} props.error - Error message to display if there's an error (optional).
 * @returns {JSX.Element} The rendered component.
 */

const ProgressUpload = ({ icon, label, size, progress = 0, onClick, error }) => {
	const theme = useTheme();

	return (
		<Box
			className="progress-bar-container"
			mt={theme.spacing(10)}
			p={theme.spacing(8)}
			sx={{
				minWidth: "200px",
				height: "fit-content",
				borderRadius: theme.shape.borderRadius,
				border: 1,
				borderColor: theme.palette.primary.lowContrast,
				backgroundColor: theme.palette.primary.lowContrast,
				"&:has(.input-error)": {
					borderColor: theme.palette.error.main,
					backgroundColor: theme.palette.error.lowContrast,
					py: theme.spacing(4),
					px: theme.spacing(8),
					"& > .MuiStack-root > svg": {
						fill: theme.palette.error.contrastText,
						width: "20px",
						height: "20px",
					},
				},
			}}
		>
			<Stack
				direction="row"
				mb={error ? 0 : theme.spacing(5)}
				gap={theme.spacing(5)}
				alignItems={error ? "center" : "flex-start"}
			>
				{error ? (
					<ErrorOutlineOutlinedIcon />
				) : icon ? (
					<Box
						sx={{
							position: "relative",
							height: 30,
							minWidth: 30,
							border: 1,
							borderColor: theme.palette.primary.lowContrast,
							borderRadius: 2,
							backgroundColor: theme.palette.primary.main,
							"& svg": {
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%, -50%)",
								width: 23,
								height: 23,
								"& path": {
									fill: theme.palette.primary.contrastTextTertiary,
								},
							},
						}}
					>
						{icon}
					</Box>
				) : (
					""
				)}
				{error ? (
					<Typography
						component="p"
						className="input-error"
						color={theme.palette.error.contrastText}
					>
						{error}
					</Typography>
				) : (
					<Box color={theme.palette.primary.contrastTextTertiary}>
						<Typography
							component="h2"
							mb={theme.spacing(1.5)}
							sx={{ wordBreak: 'break-all' }}
						>
							{error ? error : label}
						</Typography>
						<Typography
							component="p"
							sx={{ opacity: 0.6 }}
						>
							{!error && size}
						</Typography>
					</Box>
				)}
				<IconButton
					onClick={onClick}
					sx={
						!error
							? {
									alignSelf: "flex-start",
									ml: "auto",
									mr: theme.spacing(-2.5),
									mt: theme.spacing(-2.5),
									padding: theme.spacing(2.5),
									"&:focus": {
										outline: "none",
									},
								}
							: {
									ml: "auto",
									"&:focus": {
										outline: "none",
									},
								}
					}
				>
					<CloseIcon
						sx={{
							fontSize: "20px",
						}}
					/>
				</IconButton>
			</Stack>
			{!error ? (
				<Stack
					direction="row"
					alignItems="center"
				>
					<Box sx={{ width: "100%", mr: theme.spacing(5) }}>
						<LinearProgress
							variant="determinate"
							value={progress}
							sx={{
								width: "100%",
								height: "10px",
								borderRadius: theme.shape.borderRadius,
								maxWidth: "500px",
								backgroundColor: theme.palette.primary.lowContrast,
							}}
						/>
					</Box>
					<Typography
						component="p"
						sx={{ minWidth: "max-content", opacity: 0.6 }}
					>
						{progress}
						<span>%</span>
					</Typography>
				</Stack>
			) : (
				""
			)}
		</Box>
	);
};

ProgressUpload.propTypes = {
	icon: PropTypes.element, // JSX element for the icon (optional)
	label: PropTypes.string, // Label text for the progress item
	size: PropTypes.string.isRequired, // Size information for the progress item
	progress: PropTypes.number.isRequired, // Current progress value (0-100)
	onClick: PropTypes.func.isRequired, // Function to handle click events on the remove button
	error: PropTypes.string, // Error message to display if there's an error (optional)
};

export default ProgressUpload;

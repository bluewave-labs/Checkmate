// Components
import { Button, Box, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "../../../Components/Image";

// Utils
import PropTypes from "prop-types";
import { createToast } from "../../../Utils/toastUtils";
import { formatBytes } from "../../../Utils/fileUtils";
import { useCallback } from "react";
import { useTheme } from "@emotion/react";

/**
 * ImageUpload component allows users to upload images with drag-and-drop functionality.
 * It supports file size and format validation.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} [props.previewIsRound=false] - Determines if the image preview should be round
 * @param {string} [props.src] - Source URL of the image to display
 * @param {function} props.onChange - Callback function to handle file change, takes a file as an argument
 * @param {number} [props.maxSize=3145728] - Maximum file size allowed in bytes (default is 3MB)
 * @param {Array<string>} [props.accept=['jpg', 'jpeg', 'png']] - Array of accepted file formats
 * @param {Object} [props.errors] - Object containing error messages
 * @param {function} props.onError - Called with validation error message
 * @param {object} props.validationSchema - A schema object
 * @returns {JSX.Element} The rendered component
 */
const ImageUpload = ({
	previewIsRound = false,
	src,
	onChange,
	maxSize = 3 * 1024 * 1024,
	accept = ["jpg", "jpeg", "png"],
	error,
    validationSchema,
    onError,
}) => {
	const theme = useTheme();
	const roundStyle = previewIsRound ? { borderRadius: "50%" } : {};

	const handleImageChange = useCallback(
		(file) => {
			if (file.size > maxSize) {
				createToast({
					body: "File size is too large",
				});
				return;
			}
			onChange(file);
		},
		[maxSize, onChange]
	);

	if (src) {
		return (
			<Stack alignItems="center">
				<Image
					alt="company logo"
					maxWidth="250px"
					maxHeight="250px"
					src={src}
					sx={{ ...roundStyle }}
				/>
			</Stack>
		);
	}

	return (
		<>
			<Box
				minHeight={175}
				sx={{
					position: "relative",
					border: "dashed",
					borderRadius: theme.shape.borderRadius,
					borderColor: theme.palette.primary.lowContrast,
					borderWidth: "2px",
					transition: "0.2s",
					"&:hover": {
						borderColor: theme.palette.primary.main,
						backgroundColor: "hsl(215, 87%, 51%, 0.05)",
					},
				}}
				onDragLeave={(e) => {
					e.preventDefault();
				}}
				onDragOver={(e) => {
					e.preventDefault();
				}}
				onDrop={(e) => {
					e.preventDefault();
					handleImageChange(e?.dataTransfer?.files?.[0]);
				}}
			>
				<Button
					fullWidth
					component="label"
					role={undefined}
					sx={{
						height: "100%",
					}}
				>
					<Stack alignItems="center">
						<CloudUploadIcon />
						<Typography
							component="h2"
							color={theme.palette.primary.contrastTextTertiary}
						>
							<Typography
								component="span"
								fontSize="inherit"
								color="info"
								fontWeight={500}
							>
								Click to upload
							</Typography>{" "}
							or drag and drop
						</Typography>
						<Typography
							component="p"
							color={theme.palette.primary.contrastTextTertiary}
							sx={{ opacity: 0.6 }}
						>
							(maximum size: {formatBytes(maxSize)})
						</Typography>
					</Stack>
					<input
						style={{
							clip: "rect(0 0 0 0)",
							clipPath: "inset(50%)",
							height: 1,
							overflow: "hidden",
							position: "absolute",
							bottom: 0,
							left: 0,
							whiteSpace: "nowrap",
							width: 1,
						}}
						onChange={(e) => handleImageChange(e?.target?.files?.[0])}
						type="file"
						accept={accept.map((format) => `image/${format}`).join(", ")}
					/>
				</Button>
			</Box>
			<Typography
				component="p"
				sx={{ opacity: 0.6 }}
			>
				Supported formats: {accept.join(", ").toUpperCase()}
			</Typography>
			{error && (
				<Typography
					component="span"
					className="input-error"
					color={theme.palette.error.main}
					mt={theme.spacing(2)}
					sx={{
						opacity: 0.8,
					}}
				>
					{error}
				</Typography>
			)}
		</>
	);
};

ImageUpload.propTypes = {
	previewIsRound: PropTypes.bool,
	src: PropTypes.string,
	onChange: PropTypes.func,
	maxSize: PropTypes.number,
	accept: PropTypes.array,
	error: PropTypes.string,
};

export default ImageUpload;
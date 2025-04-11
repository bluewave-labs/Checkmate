// Components
import { Button, Box, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "../../../Components/Image";
import ProgressUpload from "../../ProgressBars";
import ImageIcon from "@mui/icons-material/Image";

// Utils
import PropTypes from "prop-types";
import { createToast } from "../../../Utils/toastUtils";
import { formatBytes } from "../../../Utils/fileUtils";
import { useCallback, useEffect, useRef, useState } from "react";
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
    const [file, setFile] = useState(null);
    const intervalRef = useRef(null);
    const [progress, setProgress] = useState({ value: 0, isLoading: false });

	const roundStyle = previewIsRound ? { borderRadius: "50%" } : {};

    useEffect(() => {
        return () => clearInterval(intervalRef.current);
      }, []);      

	const handleImageChange = useCallback(
        (file) => {
            if (!file) return;
        
            const mimeType = file.type;
            const isValidFormat = accept.some((format) =>
            mimeType.toLowerCase().includes(format.toLowerCase())
            );
        
            if (!isValidFormat) {
            const msg = `Unsupported file type. Supported: ${accept.join(", ").toUpperCase()}`;
            createToast({ body: msg });
            onError?.(msg);
            return;
            }
        
            if (file.size > maxSize) {
            const msg = `File size too large. Max allowed: ${formatBytes(maxSize)}`;
            createToast({ body: msg });
            onError?.(msg);
            return;
            }
        
            if (validationSchema) {
            const { error: validationError } = validationSchema.validate(
                { type: file.type, size: file.size },
                { abortEarly: false }
            );
        
            if (validationError) {
                const msg = validationError.details?.[0]?.message;
                createToast({ body: msg });
                onError?.(msg);
                return;
            }
            }
        
            const previewFile = {
            src: URL.createObjectURL(file),
            name: file.name,
            size: formatBytes(file.size),
            file,
            };
        
            setFile(previewFile);
            setProgress({ value: 0, isLoading: true });

            intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                const buffer = 12;
                if (prev.value + buffer >= 100) {
                clearInterval(intervalRef.current);
                onChange(previewFile); // fire only after reaching 100%
                return { value: 100, isLoading: false };
                }
                return { value: prev.value + buffer, isLoading: true };
            });
            }, 120);
        },
        [accept, maxSize, validationSchema, onChange, onError]
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
                    {(progress.isLoading || progress.value !== 0 || error) && file ? (
                    <ProgressUpload
                        icon={<ImageIcon />}
                        label={file.name}
                        size={file.size}
                        progress={progress.value}
                        onClick={() => {
                        clearInterval(intervalRef.current);
                        setProgress({ value: 0, isLoading: false });
                        setFile(null);
                        onChange(undefined); // notify parent image was removed
                        }}
                        error={error}
                    />
                    ) : null}
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
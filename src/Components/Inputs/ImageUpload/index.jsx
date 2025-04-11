// Components
import { Button, Box, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "../../../Components/Image";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import ProgressUpload from "../../ProgressBars";
import ImageIcon from "@mui/icons-material/Image";

// Utils
import PropTypes from "prop-types";
import { createToast } from "../../../Utils/toastUtils";
import { formatBytes } from "../../../Utils/fileUtils";
import { useCallback, useState, useRef } from "react";
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
 * @returns {JSX.Element} The rendered component
 */
const ImageUpload = ({
	previewIsRound = false,
	src,
	onChange,
	maxSize = 3 * 1024 * 1024,
	accept = ["jpg", "jpeg", "png"],
	error,
}) => {
	const theme = useTheme();

    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState({ value: 0, isLoading: false });
    const intervalRef = useRef(null);

	const roundStyle = previewIsRound ? { borderRadius: "50%" } : {};

	const handleImageChange = useCallback(
        (file) => {
          if (!file) return;
          if (file.size > maxSize) {
            createToast({ body: "File size is too large" });
            return;
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
                onChange(previewFile); // notify parent after complete
                return { value: 100, isLoading: false };
              }
              return { value: prev.value + buffer, isLoading: true };
            });
          }, 120);
        },
        [maxSize, onChange]
    );

	if (src) {
        return (
            <Stack direction="row" justifyContent="center">
            <Box
                sx={{
                width: "250px",
                height: "250px",
                overflow: "hidden",
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                ...roundStyle,
                }}
            />
            </Stack>
        );
    }
      
	return (
        <>
          {src ? (
            <Stack direction="row" justifyContent="center">
              <Box
                sx={{
                  width: "250px",
                  height: "250px",
                  overflow: "hidden",
                  backgroundImage: `url(${src})`,
                  backgroundSize: "cover",
                  ...roundStyle,
                }}
              />
            </Stack>
          ) : (
            <>
              <Box
                mt={theme.spacing(8)}
                sx={{
                  position: "relative",
                  height: "fit-content",
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
              >
                <TextField
                  type="file"
                  onChange={(e) => handleImageChange(e?.target?.files?.[0])}
                  sx={{
                    width: "100%",
                    "& .MuiInputBase-input[type='file']": {
                      opacity: 0,
                      cursor: "pointer",
                      maxWidth: "500px",
                      minHeight: "175px",
                      zIndex: 1,
                    },
                    "& fieldset": {
                      padding: 0,
                      border: "none",
                    },
                  }}
                />
                <Stack
                  alignItems="center"
                  gap="4px"
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 0,
                    width: "100%",
                  }}
                >
                  <IconButton
                    sx={{
                      pointerEvents: "none",
                      borderRadius: theme.shape.borderRadius,
                      border: `solid ${theme.shape.borderThick}px ${theme.palette.primary.lowContrast}`,
                      boxShadow: theme.shape.boxShadow,
                    }}
                  >
                    <CloudUploadIcon />
                  </IconButton>
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
              </Box>
              {(progress.isLoading || progress.value !== 0) && file && (
                <ProgressUpload
                    icon={<ImageIcon />}
                    label={file.name}
                    size={file.size}
                    progress={progress.value}
                    onClick={() => {
                    clearInterval(intervalRef.current);
                    setFile(null);
                    setProgress({ value: 0, isLoading: false });
                    onChange(undefined); // notify parent
                    }}
                    error={error}
                />
              )}
              <Typography
                component="p"
                color={theme.palette.primary.contrastTextTertiary}
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
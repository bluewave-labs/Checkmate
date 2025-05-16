// Components
import { Box, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "../../../Components/Image";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import ProgressUpload from "../../ProgressBars";
import ImageIcon from "@mui/icons-material/Image";

// Utils
import PropTypes from "prop-types";
import { useCallback, useState, useRef, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [uploadComplete, setUploadComplete] = useState(false);
  const [completedFile, setCompletedFile] = useState(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState({ value: 0, isLoading: false });
  const intervalRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

	const roundStyle = previewIsRound ? { borderRadius: "50%" } : {};

	const handleImageChange = useCallback(
        (file) => {
          if (!file) return;

          const isValidType = accept.some((type) =>
            file.type.includes(type)
          );
          const isValidSize = file.size <= maxSize;
          
          if (!isValidType) {
            setLocalError(t('invalidFileFormat'));
            return;
          }
          if (!isValidSize) {
            setLocalError(t('invalidFileSize'));
            return;
          }
          
          setLocalError(null);          
      
          const previewFile = {
            src: URL.createObjectURL(file),
            name: file.name,
            file,
          };
      
          setFile(previewFile);
          setProgress({ value: 0, isLoading: true });
      
          intervalRef.current = setInterval(() => {
            setProgress((prev) => {
              const buffer = 12;
              if (prev.value + buffer >= 100) {
                clearInterval(intervalRef.current);
                setUploadComplete(true);           
                setCompletedFile(previewFile);    
                return { value: 100, isLoading: false };
            }            
              return { value: prev.value + buffer, isLoading: true };
            });
          }, 120);
        },
        [maxSize, accept]
    );

    useEffect(() => {
        if (uploadComplete && completedFile) {
            onChange?.(completedFile);
            setUploadComplete(false);
            setCompletedFile(null);
        }
    }, [uploadComplete, completedFile, onChange]);  


	return (
        <>
          {src ? (
            <Stack direction="row" justifyContent="center">
              <Image
                alt="Uploaded preview"
                src={src}
                width="250px"
                height="250px"
                sx={{ ...roundStyle }}
            />
            </Stack>
          ) : (
            <>
              <Box
                className="image-field-wrapper"
                mt={theme.spacing(8)}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={() => setIsDragging(false)}
                sx={{
                  position: "relative",
                  height: "fit-content",
                  border: "dashed",
                  borderRadius: theme.shape.borderRadius,
                  borderColor: isDragging
                    ? theme.palette.primary.main
                    : theme.palette.primary.lowContrast,
                  backgroundColor: isDragging
                    ? "hsl(215, 87%, 51%, 0.05)"
                    : "transparent",
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
                      {t('ClickUpload')}
                    </Typography>{" "}
                    or {t('DragandDrop')}
                  </Typography>
                  <Typography
                    component="p"
                    color={theme.palette.primary.contrastTextTertiary}
                    sx={{ opacity: 0.6 }}
                  >({t('MaxSize')}: {Math.round(maxSize / 1024 / 1024)}MB)
                  </Typography>
                </Stack>
              </Box>
              {(localError || progress.isLoading || progress.value !== 0) && (
                <ProgressUpload
                  icon={<ImageIcon />}
                  label={file?.name || "Upload failed"}
                  size={file?.size}
                  progress={progress.value}
                  onClick={() => {
                    clearInterval(intervalRef.current);
                    setFile(null);
                    setProgress({ value: 0, isLoading: false });
                    setLocalError(null);
                    onChange(undefined);
                  }}
                  error={localError || error}
                />
              )}
              <Typography
                component="p"
                color={theme.palette.primary.contrastTextTertiary}
                sx={{ opacity: 0.6 }}
              >
                {t('SupportedFormats')}: {accept.join(", ").toUpperCase()}
              </Typography>
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
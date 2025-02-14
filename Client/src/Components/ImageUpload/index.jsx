import { useState, useRef } from "react";
import { Box, Button, Stack, IconButton , Typography } from "@mui/material";
import ProgressUpload from "../ProgressBars";
import { formatBytes } from "../../Utils/fileUtils";
import { imageValidation } from "../../Validation/validation";
import ImageIcon from "@mui/icons-material/Image";
import {GenericDialog} from "../Dialog/genericDialog";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { checkImage } from "../../Utils/fileUtils";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

/**
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Controls whether the upload modal is open.
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} props.onUpdate - Callback function triggered when an image is successfully uploaded.
 * @param {string} [props.placeholder] - Optional placeholder image (URL or base64).
 * @param {number} [props.maxSize=3145728] - Maximum allowed file size in bytes (default: 3MB).
 * @param {string[]} [props.acceptedTypes] - List of allowed image MIME types (e.g., `["image/png", "image/jpeg"]`).
 * @param {number} [props.previewSize=150] - Size of the image preview in pixels.
 * @param {function} [props.setErrors] - Function to set error messages in the parent component.
 * @param {Object} [props.errors={}] - Object containing validation errors.
 * 
 * @example
 * <ImageUpload 
 *    open={isOpen} 
 *    onClose={setIsOpen(false)}
 *    onUpdate={(imageUrl) => console.log("Image uploaded:", imageUrl)}
 *    maxSize={5 * 1024 * 1024} // 5MB
 *    acceptedTypes={["image/png", "image/jpeg"]}
 * />
 */

const isValidBase64Image = (data) => {
    return /^[A-Za-z0-9+/=]+$/.test(data);
  };

const DEFAULT_MAX_SIZE = 3 * 1024 * 1024; // 3MB

const ImageUpload = ({ open, onClose, onUpdate, placeholder, maxSize = DEFAULT_MAX_SIZE, acceptedTypes, previewSize = 150, setErrors, errors = {}}) => {

  const [file, setFile] = useState();
  const [progress, setProgress] = useState({ value: 0, isLoading: false });
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef(null);
  const theme = useTheme();
  const UPLOAD_PROGRESS_INCREMENT = 12;  // Controls the speed of upload progress
  const UPLOAD_PROGRESS_INTERVAL = 120;  // Controls how often progress updates (milliseconds)
  const UPLOAD_COMPLETE = 100;  // Represents the max progress percentage
  const { t } = useTranslation();
  
  // Handle base64 and placeholder logic
  let imageSrc = placeholder || ""; // Default to placeholder or empty string

  if (file?.src) {
      imageSrc = file.src; // Use uploaded file's preview
  } else if (placeholder && isValidBase64Image(placeholder)) {
      imageSrc = `data:image/png;base64,${placeholder}`; // Convert base64 string if valid
  } else {
      imageSrc = ""; // Ensure it's an empty string instead of "undefined"
  }  

  const handleDrag = (event, isDragging) => {
    event.preventDefault();
    setIsDragging(isDragging);

    if (event.type === "drop" && event.dataTransfer.files.length > 0) {
        handlePicture({ target: { files: event.dataTransfer.files } });
    }
  };

  // Handles image file selection
  const handlePicture = (event) => {
    const pic = event.target.files[0];
    if (!pic) return;

    event.target.value = "";
    setFile(null);

    if (maxSize && pic.size > maxSize) {
        const errorMsg = `File size exceeds ${formatBytes(maxSize)}`;
        if (setErrors) setErrors?.((prev) => ({ ...prev, picture: errorMsg }));
        return;
    }

    if (acceptedTypes && !acceptedTypes.includes(pic.type)) {
        const errorMsg = `File type not supported. Allowed: ${acceptedTypes.join(", ")}`;
        if (setErrors) setErrors?.((prev) => ({ ...prev, picture: errorMsg }));
        return;
    }

    // Validate file type and size using schema
    let error = validateField({ type: pic.type, size: pic.size }, imageValidation);
    if (error) return;

    setProgress({ value: 0, isLoading: true });
    setFile({
        src: URL.createObjectURL(pic),
        name: pic.name,
        size: formatBytes(pic.size),
        delete: false,
    });

    // Simulate upload progress
    intervalRef.current = setInterval(() => {
        setProgress((prev) => {
            const nextValue = prev.value + UPLOAD_PROGRESS_INCREMENT;
            if (nextValue >= UPLOAD_COMPLETE) {
                clearInterval(intervalRef.current);
                return { value: UPLOAD_COMPLETE, isLoading: false };
            }
            return { ...prev, value: nextValue };
        });
    }, UPLOAD_PROGRESS_INTERVAL);
    };

  // Validates input against provided schema and updates error state
  const validateField = (toValidate, schema, name = "picture") => {
    const { error } = schema.validate(toValidate, { abortEarly: false });
    if (setErrors) {
        setErrors?.((prev) => {
            const prevErrors = { ...prev };
            if (error) {
                prevErrors[name] = error.details[0].message;
            } else {
                delete prevErrors[name];
            }
            return prevErrors;
        });
    }
    return !!error;
  };

  // Resets picture-related states and clears interval
  const removePicture = () => {
    errors["picture"] && setErrors((prev) => ({ ...prev, picture: undefined }));
    setFile(null);
    clearInterval(intervalRef.current);
    setProgress({ value: 0, isLoading: false });
  };

  // Updates the profile picture and closes the modal
  const handleUpdatePicture = () => {
    if (file?.src) {
        onUpdate(file.src);
    }
    setProgress({ value: 0, isLoading: false });
    onClose("");  // Close the modal
  };

  return (
    <GenericDialog
        id="modal-update-picture"
        open={open}
        onClose={onClose}
        title={t("uploadImage")}
        description={t("selectImage")}
        confirmationButtonLabel={t("update")}
        onConfirm={handleUpdatePicture}
        theme={theme}
        isLoading={false}
        >
        <Box
            className="image-field-wrapper"
            sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "180px",
                maxHeight: "220px",
                border: "dashed",
                borderRadius: theme.shape.borderRadius,
                borderColor: isDragging ? theme.palette.primary.main : theme.palette.primary.lowContrast,
                borderWidth: "2px",
                transition: "0.2s",
                "&:hover": {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: "hsl(215, 87%, 51%, 0.05)",
                },
            }}
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDrop={(e) => handleDrag(e, false)}
            onDragOver={(e) => e.preventDefault()}
        >
        <input
            id="update-profile-picture"
            type="file"
            onChange={handlePicture}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                zIndex: 3,  
                pointerEvents: "all",
            }}
        />

            {!checkImage(imageSrc) || progress.isLoading ? (
            <>
                <Stack
                    className="custom-file-text"
                    alignItems="center"
                    gap={theme.spacing(0.5)}
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1,
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
                    <Typography component="h2" color={theme.palette.primary.contrastTextTertiary}>
                        <Typography component="span" fontSize="inherit" color="info" fontWeight={500}>
                        Click to upload
                        </Typography>{" "}
                        or drag and drop
                    </Typography>
                    <Typography
                        component="p"
                        color={theme.palette.primary.contrastTextTertiary}
                        sx={{ opacity: 0.6 }}
                    >
                        (Maximum size: {formatBytes(maxSize)})
                    </Typography>
                </Stack>
            </>
        ) : (
            <Box
                sx={{
                    width: `${previewSize}px`, 
                    height: `${previewSize}px`, 
                    overflow: "hidden",
                    backgroundImage: imageSrc ? `url(${imageSrc})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            />
        )}
        </Box>

        {progress.isLoading || progress.value !== 0 || errors?.picture ? (
            <ProgressUpload
            icon={<ImageIcon />}
            label={file?.name}
            size={file?.size || "0 KB"}
            progress={progress.value}
            onClick={removePicture}
            error={errors?.picture}
            />
        ) : null}

        <Stack
            direction="row"
            mt={theme.spacing(2)} 
            gap={theme.spacing(2)}
            justifyContent="flex-end"
        >
            <Button
            variant="text"
            color="info"
            onClick={removePicture}
            >
            Remove
            </Button>
            <Button
            variant="contained"
            color="accent"
            onClick={handleUpdatePicture}
            disabled={
                (Object.keys(errors).length !== 0 && errors?.picture) ||
                progress.value !== UPLOAD_COMPLETE 
                ? true
                : false
            }
            >
            Update
            </Button>
        </Stack>
    </GenericDialog>
  );
};

export default ImageUpload;
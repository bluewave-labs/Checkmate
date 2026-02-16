import { Box, Stack, Typography, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Upload, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface FileObject {
	src: string;
	name: string;
	file: File;
}

interface ImageUploadProps {
	src?: string;
	onChange?: (file: FileObject | undefined) => void;
	maxSize?: number;
	accept?: string[];
	error?: string;
}

export const ImageUpload = ({
	src,
	onChange,
	maxSize = 3 * 1024 * 1024,
	accept = ["jpg", "jpeg", "png"],
	error,
}: ImageUploadProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);
	const [preview, setPreview] = useState<FileObject | null>(null);

	const handleFile = useCallback(
		(file: File | undefined) => {
			if (!file) return;
			const isValidType = accept.some((type) => file.type.includes(type));
			const isValidSize = file.size <= maxSize;
			if (!isValidType) {
				setLocalError(t("components.imageUpload.errors.invalidFileFormat"));
				return;
			}
			if (!isValidSize) {
				setLocalError(t("components.imageUpload.errors.invalidFileSize"));
				return;
			}
			setLocalError(null);
			const fileObj: FileObject = {
				src: URL.createObjectURL(file),
				name: file.name,
				file,
			};
			setPreview(fileObj);
			onChange?.(fileObj);
		},
		[maxSize, accept, onChange, t]
	);

	const handleClear = () => {
		setPreview(null);
		setLocalError(null);
		onChange?.(undefined);
		if (inputRef.current) inputRef.current.value = "";
	};

	const displaySrc = src || preview?.src;
	const displayError = localError || error;

	return (
		<Stack sx={{ width: "100%", maxWidth: 500 }}>
			{displaySrc ? (
				<Stack
					alignItems="center"
					gap={1}
				>
					<Box
						component="img"
						src={displaySrc}
						alt="Preview"
						sx={{ maxWidth: 250, maxHeight: 250, objectFit: "contain", borderRadius: 1 }}
					/>
					<IconButton
						size="small"
						onClick={handleClear}
						sx={{ color: theme.palette.error.main }}
					>
						<X size={18} />
					</IconButton>
				</Stack>
			) : (
				<Stack
					onDragOver={(e) => {
						e.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={(e) => {
						e.preventDefault();
						setIsDragging(false);
						handleFile(e.dataTransfer.files?.[0]);
					}}
					alignItems="center"
					justifyContent="center"
					gap={1}
					sx={{
						position: "relative",
						width: "100%",
						minHeight: 150,
						border: "2px dashed",
						borderRadius: 1,
						borderColor: isDragging ? theme.palette.primary.main : theme.palette.divider,
						backgroundColor: isDragging ? theme.palette.action.hover : "transparent",
						transition: "0.2s",
						cursor: "pointer",
						"&:hover": {
							borderColor: theme.palette.primary.main,
							backgroundColor: theme.palette.action.hover,
						},
					}}
				>
					<input
						ref={inputRef}
						type="file"
						accept={accept.map((ext) => `.${ext}`).join(",")}
						onChange={(e) => handleFile(e.target.files?.[0])}
						style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
					/>
					<Upload size={24} />
					<Typography
						variant="body2"
						color="text.secondary"
					>
						<Typography
							component="span"
							variant="body2"
							color="primary"
							fontWeight={500}
						>
							{t("components.imageUpload.clickToUpload")}
						</Typography>{" "}
						{t("components.imageUpload.orDragAndDrop")}
					</Typography>
					<Typography
						variant="caption"
						color="text.disabled"
					>
						{accept.join(", ").toUpperCase()} • {t("components.imageUpload.maxSize")}{" "}
						{Math.round(maxSize / 1024 / 1024)}MB
					</Typography>
				</Stack>
			)}
			{displayError && (
				<Typography
					variant="caption"
					color="error"
					sx={{ mt: 1 }}
				>
					{displayError}
				</Typography>
			)}
		</Stack>
	);
};

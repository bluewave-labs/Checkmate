import { useTheme } from "@emotion/react";
import { useState, useRef, useEffect } from "react";
import { Button, Typography } from "@mui/material";
import { parse } from "papaparse";
import { bulkMonitorsValidation } from "../../../Validation/validation";
import { useTranslation } from "react-i18next";

export function Upload({ onComplete }) {
	const theme = useTheme();
	const [file, setFile] = useState();
	const [error, setError] = useState("");
	const inputRef = useRef();
	const { t } = useTranslation();

	const handleSelectFile = () => {
		inputRef.current.click();
	};

	const handleFileChange = (e) => {
		setError("");
		setFile(e.target.files[0]);
	};

	useEffect(() => {
		if (!file) return;
		parse(file, {
			header: true,
			skipEmptyLines: true,
			transform: (value, header) => {
				if (!value) {
					return undefined;
				}
				if (header === "port" || header === "interval") {
					return parseInt(value);
				}
				return value;
			},
			complete: ({ data, errors }) => {
				if (errors.length > 0) {
					setError(t("uptime.bulkImport.parsingFailed"));
					return;
				}
				const { error } = bulkMonitorsValidation.validate(data);
				if (error) {
					setError(
						error.details?.[0]?.message ||
							error.message ||
							t("uptime.bulkImport.validationFailed")
					);
					return;
				}
				onComplete(data);
			},
		});
	}, [file]);

	return (
		<div>
			<input
				ref={inputRef}
				type="file"
				accept=".csv"
				style={{ display: "none" }}
				onChange={handleFileChange}
			/>
			<Typography
				component="h2"
				mb={theme.spacing(1.5)}
				sx={{ wordBreak: "break-all" }}
			>
				{file?.name}
			</Typography>
			<Typography
				component="div"
				mb={theme.spacing(1.5)}
				color={theme.palette.error.main}
			>
				{error}
			</Typography>
			<Button
				variant="contained"
				color="accent"
				onClick={handleSelectFile}
			>
				{t("uptime.bulkImport.selectFile")}
			</Button>
		</div>
	);
}

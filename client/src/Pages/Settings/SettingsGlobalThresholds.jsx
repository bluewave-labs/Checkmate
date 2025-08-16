import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import TextInput from "../../Components/Inputs/TextInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";

import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const SettingsGlobalThresholds = ({
	isAdmin,
	HEADING_SX,
	settingsData,
	setSettingsData,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [templateValue, setTemplateValue] = useState(""); // selected template
	const [textBoxValue, setTextBoxValue] = useState(""); // new template name
	const [thresholdValues, setThresholdValues] = useState({
		cpu: "",
		memory: "",
		disk: "",
		temperature: "",
	});
	if (!isAdmin) return null;

	// Threshold ranges
	const ranges = {
		cpu: { min: 1, max: 100 },
		memory: { min: 1, max: 100 },
		disk: { min: 1, max: 100 },
		temperature: { min: 1, max: 150 },
	};

	// Handle create/edit/delete templates
	const handleUpdate = () => {
		const selectedTemplate = templateValue;
		const newTemplateName = textBoxValue?.trim();

		// Build thresholds object with numbers only
		const thresholds = {};
		["cpu", "memory", "disk", "temperature"].forEach((key) => {
			const val = thresholdValues[key];
			if (val !== "") thresholds[key] = Number(val); // convert to number
		});

		// Copy current templates
		const templates = { ...settingsData?.settings?.globalThresholds };

		// Delete template if selected and all thresholds empty
		if (selectedTemplate && Object.keys(thresholds).length === 0) {
			delete templates[selectedTemplate];
		} else if (
			(newTemplateName || selectedTemplate) &&
			Object.keys(thresholds).length > 0
		) {
			const name = newTemplateName || selectedTemplate;
			templates[name] = thresholds;
			if (newTemplateName) setTextBoxValue("");
		}

		// Update state
		setSettingsData((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				globalThresholds: templates,
			},
		}));
		setTemplateValue("");
		setThresholdValues({ cpu: "", memory: "", disk: "", temperature: "" });
	};

	const onchangeDropdown = (e) => {
		const selected = e.target.value;
		setTemplateValue(selected);

		if (selected) {
			setThresholdValues({
				cpu: settingsData?.settings?.globalThresholds?.[selected]?.cpu || "",
				memory: settingsData?.settings?.globalThresholds?.[selected]?.memory || "",
				disk: settingsData?.settings?.globalThresholds?.[selected]?.disk || "",
				temperature:
					settingsData?.settings?.globalThresholds?.[selected]?.temperature || "",
			});
		} else {
			setThresholdValues({ cpu: "", memory: "", disk: "", temperature: "" });
		}
	};

	// Template keys for dropdown
	const templateKeys = settingsData?.settings?.globalThresholds
		? Object.keys(settingsData.settings.globalThresholds)
		: [];

	// Input change with validation
	const handleThresholdChange = (name, value) => {
		const { min, max } = ranges[name];
		let val = value;

		if (val != "") {
			val = parseInt(val, 10);
			if (isNaN(val)) val = "";
			else if (val < min) val = min;
			else if (val > max) val = max;
		}

		setThresholdValues((prev) => ({
			...prev,
			[name]: val,
		}));
	};

	// Disable update if no template selected and no new template
	const isUpdateDisabled = !templateValue && !textBoxValue.trim();

	return (
		<ConfigBox>
			{/* Header */}
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsPage.globalThresholds.title", "Global Thresholds")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t(
						"settingsPage.globalThresholds.description",
						"Configure global CPU, Memory, Disk, and Temperature thresholds."
					)}
				</Typography>
			</Box>

			<Stack gap={theme.spacing(20)}>
				{/* Template Section */}
				<Stack gap={theme.spacing(10)}>
					<Box>
						<Typography
							component="h1"
							variant="h2"
						>
							{t("settingsPage.globalThresholds.templateHeading", "Template Settings")}
						</Typography>
						<Typography sx={HEADING_SX}>
							{t(
								"settingsPage.globalThresholds.templateDescription",
								"Select a template to edit its values, then click Update. To delete, select a template and leave all values empty. To add a new template, enter a name, fill values, and click Update."
							)}
						</Typography>
					</Box>

					<FormControl fullWidth>
						<InputLabel id="template-select-label">
							{t("settingsPage.globalThresholds.editTemplate", "Edit Template")}
						</InputLabel>
						<Select
							labelId="template-select-label"
							value={templateValue}
							onChange={onchangeDropdown}
						>
							<MenuItem value="">
								{t("settingsPage.globalThresholds.selectTemplate", "Select Template")}
							</MenuItem>
							{templateKeys.map((key) => (
								<MenuItem
									key={key}
									value={key}
								>
									{key}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<TextInput
						label={t(
							"settingsPage.globalThresholds.newTemplateName",
							"New Template Name"
						)}
						name="newTemplateName"
						value={textBoxValue}
						onChange={(e) => setTextBoxValue(e.target.value)}
					/>
				</Stack>

				{/* Threshold Inputs */}
				<Stack gap={theme.spacing(10)}>
					{[
						["CPU Threshold (%)", "cpu", 1, 100],
						["Memory Threshold (%)", "memory", 1, 100],
						["Disk Threshold (%)", "disk", 1, 100],
						["Temperature Threshold (°C)", "temperature", 1, 150],
					].map(([label, name, min, max]) => (
						<TextInput
							key={name}
							name={name}
							label={label}
							placeholder={`${min} - ${max}`}
							type="number"
							value={thresholdValues[name]}
							onChange={(e) => handleThresholdChange(name, e.target.value)}
						/>
					))}
				</Stack>

				<Button
					variant="contained"
					color="accent"
					sx={{ px: theme.spacing(4), py: theme.spacing(8), width: "fit-content" }}
					onClick={handleUpdate}
					disabled={isUpdateDisabled}
				>
					{t("settingsPage.globalThresholds.UpdateChanges", "Update Changes")}
				</Button>
			</Stack>
		</ConfigBox>
	);
};

SettingsGlobalThresholds.propTypes = {
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
};

export default SettingsGlobalThresholds;

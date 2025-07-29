import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import TextInput from "../../Components/Inputs/TextInput";

import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";

const SettingsGlobalThresholds = ({
	isAdmin,
	HEADING_SX,
	settingsData,
	setSettingsData,
}) => {
	const { t } = useTranslation(); // For language translation
	const theme = useTheme(); // MUI theme access

	// Handles input change and updates parent state
	const handleChange = (e, min, max) => {
		const { name, value } = e.target;

		const numValue = parseFloat(value);
		const isValidNumber =
			value === "" ||
			(!isNaN(numValue) && isFinite(numValue) && numValue >= min && numValue <= max);

		if (isValidNumber) {
			setSettingsData((prev) => ({
				...prev,
				settings: {
					...prev.settings,
					globalThresholds: {
						...prev.settings?.globalThresholds,
						[name]: value,
					},
				},
			}));
		}
	};

	// Only render this section for admins
	if (!isAdmin) return null;

	return (
		<ConfigBox>
			{/* Header and description */}
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

			{/* Threshold inputs */}
			<Stack gap={theme.spacing(20)}>
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
						value={settingsData?.settings?.globalThresholds?.[name] || ""}
						onChange={(e) => handleChange(e, min, max)}
					/>
				))}
			</Stack>
		</ConfigBox>
	);
};

// Prop types
SettingsGlobalThresholds.propTypes = {
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
};

export default SettingsGlobalThresholds;

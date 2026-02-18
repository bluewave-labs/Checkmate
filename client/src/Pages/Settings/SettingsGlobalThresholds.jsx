import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";

import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";

const SettingsGlobalThresholds = ({
	isAdmin,
	HEADING_SX,

	control,
	defaults,
}) => {
	const { t } = useTranslation(); // For language translation
	const theme = useTheme(); // MUI theme access

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
					{t("pages.settings.globalThresholds.title", "Global Thresholds")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t(
						"pages.settings.globalThresholds.description",
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
					<Controller
						key={name}
						name={`globalThresholds.${name}`}
						control={control}
						defaultValue={defaults.globalThresholds?.[name]}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={label}
								placeholder={`${min} - ${max}`}
								type="number"
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
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
};

export default SettingsGlobalThresholds;

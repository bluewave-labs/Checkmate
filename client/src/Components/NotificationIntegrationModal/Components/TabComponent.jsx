import React from "react";
import { Typography, Box, Button, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import TextInput from "../../../Components/Inputs/TextInput";
import Select from "../../../Components/Inputs/Select";
import Checkbox from "../../../Components/Inputs/Checkbox";

const TabComponent = ({
	type,
	integrations,
	handleIntegrationChange,
	handleInputChange,
	handleTestNotification,
	isLoading,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	// Helper to get the field state key (e.g., slackWebhook, telegramToken)
	const getFieldKey = (typeId, fieldId) => {
		return `${typeId}${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;
	};

	// Check if a field should be shown based on conditions
	const shouldShowField = (field) => {
		if (!field.condition) return true;

		const conditionFieldKey = getFieldKey(type.id, field.condition.field);
		const conditionValue = integrations[conditionFieldKey];
		return conditionValue === field.condition.value;
	};

	// Check if all required fields have values to enable test button
	const areAllFieldsFilled = () => {
		return type.fields.every((field) => {
			// Skip conditional fields that shouldn't be shown
			if (!shouldShowField(field)) return true;

			const fieldKey = getFieldKey(type.id, field.id);
			return integrations[fieldKey];
		});
	};

	return (
		<>
			<Typography
				variant="subtitle1"
				component="h4"
				sx={{
					fontWeight: "bold",
					color: theme.palette.primary.contrastTextSecondary,
				}}
			>
				{type.label}
			</Typography>

			<Typography
				sx={{
					mt: theme.spacing(0.5),
					mb: theme.spacing(1.5),
					color: theme.palette.primary.contrastTextTertiary,
				}}
			>
				{type.description}
			</Typography>

			<Box sx={{ pl: theme.spacing(1.5) }}>
				<Checkbox
					id={`enable-${type.id}`}
					label={t("notifications.enableNotifications", { platform: type.label })}
					isChecked={integrations[type.id]}
					onChange={(e) => handleIntegrationChange(type.id, e.target.checked)}
					disabled={isLoading}
				/>
			</Box>

			{type.fields.map((field) => {
				const fieldKey = getFieldKey(type.id, field.id);

				// Skip rendering if field shouldn't be shown
				if (!shouldShowField(field)) return null;

				return (
					<Box
						key={field.id}
						sx={{ mt: theme.spacing(1) }}
					>
						<Typography
							sx={{
								mb: theme.spacing(2),
								fontWeight: "bold",
								color: theme.palette.primary.contrastTextSecondary,
							}}
						>
							{field.label}
						</Typography>

						{field.type === "select" ? (
							<Select
								id={`${type.id}-${field.id}`}
								items={field.options}
								value={integrations[fieldKey] || ""}
								onChange={(e) => handleInputChange(fieldKey, e.target.value)}
								disabled={!integrations[type.id] || isLoading}
							/>
						) : (
							<TextInput
								id={`${type.id}-${field.id}`}
								type={field.type}
								placeholder={field.placeholder}
								value={integrations[fieldKey] || ""}
								onChange={(e) => handleInputChange(fieldKey, e.target.value)}
								disabled={!integrations[type.id] || isLoading}
							/>
						)}
					</Box>
				);
			})}

			<Box sx={{ mt: theme.spacing(1) }}>
				<Button
					variant="text"
					color="info"
					onClick={() => handleTestNotification(type.id)}
					disabled={!integrations[type.id] || !areAllFieldsFilled() || isLoading}
				>
					{isLoading ? (
						<CircularProgress
							size={theme.spacing(8)}
							sx={{ mr: theme.spacing(1), color: theme.palette.accent.main }}
						/>
					) : null}
					{t("notifications.testNotification")}
				</Button>
			</Box>
		</>
	);
};

export default TabComponent;

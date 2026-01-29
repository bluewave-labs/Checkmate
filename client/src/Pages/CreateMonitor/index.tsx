import { useMemo } from "react";
import { useEffect } from "react";
import { useParams } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import { useTranslation } from "react-i18next";

import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import { RadioWithDescription, Button, TextField, Select } from "@/Components/v2/inputs";
import { useGet } from "@/Hooks/UseApi";
import { useMonitorForm } from "@/Hooks/useMonitorForm";
import type { Monitor, MonitorType } from "@/Types/Monitor";
import type { MonitorFormData } from "@/Validation/monitor";
import MenuItem from "@mui/material/MenuItem";

interface GeneralSettingsConfig {
	urlLabel: string;
	urlPlaceholder: string;
	namePlaceholder: string;
	showPort: boolean;
	showGameSelect: boolean;
}

const getGeneralSettingsConfig = (
	type: MonitorType,
	t: (key: string) => string
): GeneralSettingsConfig => {
	const configs: Record<string, GeneralSettingsConfig> = {
		http: {
			urlLabel: t("monitorType.http.label"),
			urlPlaceholder: t("monitorType.http.placeholder"),
			namePlaceholder: t("monitorType.http.namePlaceholder"),
			showPort: false,
			showGameSelect: false,
		},
		ping: {
			urlLabel: t("monitorType.ping.label"),
			urlPlaceholder: t("monitorType.ping.placeholder"),
			namePlaceholder: t("monitorType.ping.namePlaceholder"),
			showPort: false,
			showGameSelect: false,
		},
		docker: {
			urlLabel: t("monitorType.docker.label"),
			urlPlaceholder: t("monitorType.docker.placeholder"),
			namePlaceholder: t("monitorType.docker.namePlaceholder"),
			showPort: false,
			showGameSelect: false,
		},
		port: {
			urlLabel: t("monitorType.port.label"),
			urlPlaceholder: t("monitorType.port.placeholder"),
			namePlaceholder: t("monitorType.port.namePlaceholder"),
			showPort: true,
			showGameSelect: false,
		},
		game: {
			urlLabel: t("monitorType.game.label"),
			urlPlaceholder: t("monitorType.game.placeholder"),
			namePlaceholder: t("monitorType.game.namePlaceholder"),
			showPort: true,
			showGameSelect: true,
		},
	};
	return configs[type] || configs.http;
};

const CreateMonitorPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { monitorId } = useParams();
	const isEditMode = Boolean(monitorId);

	const { data: existingMonitor } = useGet<Monitor>(
		isEditMode ? `/monitors/${monitorId}` : null
	);

	const { schema, defaults } = useMonitorForm({ data: existingMonitor ?? null });

	const form = useForm<MonitorFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const { control, watch, handleSubmit, clearErrors } = form;

	useEffect(() => {
		form.reset(defaults);
	}, [defaults, form]);

	const watchedType = watch("type") as MonitorType;

	useEffect(() => {
		clearErrors();
	}, [watchedType, clearErrors]);

	const generalSettingsConfig = useMemo(
		() => getGeneralSettingsConfig(watchedType, t),
		[watchedType, t]
	);

	const onSubmit = async (data: MonitorFormData) => {
		console.log(data);
	};

	const onError = (errors: unknown) => {
		console.log(errors);
	};

	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit(onSubmit, onError)}
		>
			{/* Monitor Type Selection */}
			<ConfigBox
				title={t("pages.createMonitor.form.type.title")}
				subtitle={t("pages.createMonitor.form.type.description")}
				rightContent={
					<Controller
						name="type"
						control={control}
						render={({ field, fieldState }) => (
							<FormControl error={!!fieldState.error}>
								<RadioGroup
									{...field}
									sx={{ gap: theme.spacing(6) }}
								>
									<RadioWithDescription
										value="http"
										label={t("pages.createMonitor.form.type.optionHttp")}
										description={t("pages.createMonitor.form.type.optionHttpDescription")}
									/>
									<RadioWithDescription
										value="ping"
										label={t("pages.createMonitor.form.type.optionPing")}
										description={t("pages.createMonitor.form.type.optionPingDescription")}
									/>
									<RadioWithDescription
										value="docker"
										label={t("pages.createMonitor.form.type.optionDocker")}
										description={t(
											"pages.createMonitor.form.type.optionDockerDescription"
										)}
									/>
									<RadioWithDescription
										value="port"
										label={t("pages.createMonitor.form.type.optionPort")}
										description={t("pages.createMonitor.form.type.optionPortDescription")}
									/>
									<RadioWithDescription
										value="game"
										label={t("pages.createMonitor.form.type.optionGame")}
										description={t("pages.createMonitor.form.type.optionGameDescription")}
									/>
								</RadioGroup>
							</FormControl>
						)}
					/>
				}
			/>

			{/* General Settings - Dynamic based on type */}
			<ConfigBox
				title={t("pages.createMonitor.form.general.title")}
				subtitle={t(`pages.createMonitor.form.general.description.${watchedType}`)}
				rightContent={
					<Stack spacing={theme.spacing(8)}>
						{/* URL/Host/Container field */}
						<Controller
							name="url"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={generalSettingsConfig.urlLabel}
									placeholder={generalSettingsConfig.urlPlaceholder}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>

						{/* Port field - only for port and game types */}
						{generalSettingsConfig.showPort && (
							<Controller
								name="port"
								control={control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										onChange={(e) => field.onChange(Number(e.target.value) || 0)}
										type="number"
										fieldLabel={t("portToMonitor")}
										placeholder="5173"
										fullWidth
										error={!!fieldState.error}
										helperText={fieldState.error?.message ?? ""}
									/>
								)}
							/>
						)}

						{/* Game select - only for game type */}
						{generalSettingsConfig.showGameSelect && (
							<Controller
								name="gameId"
								control={control}
								render={({ field, fieldState }) => (
									<Select
										{...field}
										value={field.value ?? ""}
										fieldLabel={t("chooseGame")}
										error={!!fieldState.error}
									>
										<MenuItem value="">Select a game</MenuItem>
									</Select>
								)}
							/>
						)}

						{/* Display name field - common to all types */}
						<Controller
							name="name"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={t("displayName")}
									placeholder={generalSettingsConfig.namePlaceholder}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
					</Stack>
				}
			/>

			{/* Submit Button */}
			<Stack
				direction="row"
				justifyContent="flex-end"
			>
				<Button
					loading={false}
					type="submit"
					variant="contained"
					color="primary"
				>
					{t("common.buttons.save")}
				</Button>
			</Stack>
		</BasePage>
	);
};

export default CreateMonitorPage;

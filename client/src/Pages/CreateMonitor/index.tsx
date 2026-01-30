import { useMemo } from "react";
import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import { useTranslation } from "react-i18next";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import { Trash2 } from "lucide-react";

import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import {
	RadioWithDescription,
	Button,
	TextField,
	Select,
	Autocomplete,
	SwitchComponent as Switch,
	SliderWithLabel,
} from "@/Components/v2/inputs";
import { useGet, usePost, usePut } from "@/Hooks/UseApi";
import { useMonitorForm } from "@/Hooks/useMonitorForm";
import type { Monitor, MonitorType } from "@/Types/Monitor";
import type { Notification } from "@/Types/Notification";
import type { MonitorFormData } from "@/Validation/monitor";

interface GeneralSettingsConfig {
	urlLabel: string;
	urlPlaceholder: string;
	namePlaceholder: string;
	showUrl: boolean;
	showPort: boolean;
	showGameSelect: boolean;
	showSecret: boolean;
}

const getGeneralSettingsConfig = (
	type: MonitorType,
	t: (key: string) => string
): GeneralSettingsConfig => {
	const configs: Record<string, GeneralSettingsConfig> = {
		http: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
		},
		ping: {
			urlLabel: t("pages.createMonitor.form.general.option.host.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.host.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
		},
		docker: {
			urlLabel: t("pages.createMonitor.form.general.option.container.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.container.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
		},
		port: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: true,
			showGameSelect: false,
			showSecret: false,
		},
		game: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: true,
			showGameSelect: true,
			showSecret: false,
		},
		pagespeed: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
		},
		hardware: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: true,
		},
	};
	return configs[type] || configs.http;
};

const CreateMonitorPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { monitorId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const isEditMode = Boolean(monitorId);

	// Extract page type from URL path (e.g., /pagespeed/create -> pagespeed)
	const pageType = useMemo(() => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		const firstSegment = pathSegments[0];
		if (firstSegment === "pagespeed") return "pagespeed";
		if (firstSegment === "infrastructure") return "hardware";
		return "uptime";
	}, [location.pathname]);

	const showTypeSelector = pageType === "uptime" && !isEditMode;
	const defaultType: MonitorType = pageType === "pagespeed" ? "pagespeed" : pageType === "hardware" ? "hardware" : "http";

	const { data: existingMonitor } = useGet<Monitor>(
		isEditMode ? `/monitors/${monitorId}` : null
	);

	// Fetch notifications for the team
	const { data: notifications } = useGet<Notification[]>("/notifications/team");

	const { schema, defaults } = useMonitorForm({ data: existingMonitor ?? null, defaultType });

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

	const { post, loading: isCreating } = usePost<MonitorFormData, Monitor>();
	const { put, loading: isUpdating } = usePut<MonitorFormData, Monitor>();
	const isSubmitting = isCreating || isUpdating;

	const onSubmit = async (data: MonitorFormData) => {
		let result;
		if (isEditMode && monitorId) {
			result = await put(`/monitors/${monitorId}`, data);
		} else {
			result = await post("/monitors", data);
		}

		if (result?.success) {
			// Navigate based on page type
			if (pageType === "pagespeed") {
				navigate("/pagespeed");
			} else if (pageType === "hardware") {
				navigate("/infrastructure");
			} else {
				navigate("/uptime");
			}
		}
	};

	const onError = (errors: unknown) => {
		console.log(errors);
	};

	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit(onSubmit, onError)}
		>
			{/* Monitor Type Selection - only shown for uptime monitors */}
			{showTypeSelector && (
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
			)}

			{/* General Settings - Dynamic based on type */}
			<ConfigBox
				title={t("pages.createMonitor.form.general.title")}
				subtitle={t(`pages.createMonitor.form.general.description.${watchedType}`)}
				rightContent={
					<Stack spacing={theme.spacing(8)}>
						{/* URL/Host/Container field - not shown for hardware */}
						{generalSettingsConfig.showUrl && (
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
										disabled={isEditMode}
										error={!!fieldState.error}
										helperText={fieldState.error?.message ?? ""}
									/>
								)}
							/>
						)}

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

						{/* Secret field - only for hardware type */}
						{generalSettingsConfig.showSecret && (
							<Controller
								name="secret"
								control={control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										type="text"
										fieldLabel={t("pages.createMonitor.form.general.option.secret.label")}
										placeholder={t(
											"pages.createMonitor.form.general.option.secret.placeholder"
										)}
										fullWidth
										error={!!fieldState.error}
										helperText={fieldState.error?.message ?? ""}
									/>
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
									fieldLabel={t("pages.createMonitor.form.general.option.name.label")}
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

			{/* Frequency ConfigBox */}
			<ConfigBox
				title={t("pages.createMonitor.form.frequency.title")}
				subtitle={t("pages.createMonitor.form.frequency.description")}
				rightContent={
					<Controller
						name="interval"
						control={control}
						render={({ field, fieldState }) => (
							<Select
								{...field}
								value={field.value ?? 60000}
								fieldLabel={t(
									"pages.createMonitor.form.frequency.option.frequency.label"
								)}
								error={!!fieldState.error}
							>
								<MenuItem value={15000}>{t("time.fifteenSeconds")}</MenuItem>
								<MenuItem value={30000}>{t("time.thirtySeconds")}</MenuItem>
								<MenuItem value={60000}>{t("time.oneMinute")}</MenuItem>
								<MenuItem value={120000}>{t("time.twoMinutes")}</MenuItem>
								<MenuItem value={180000}>{t("time.threeMinutes")}</MenuItem>
								<MenuItem value={240000}>{t("time.fourMinutes")}</MenuItem>
								<MenuItem value={300000}>{t("time.fiveMinutes")}</MenuItem>
								<MenuItem value={600000}>{t("time.tenMinutes")}</MenuItem>
								<MenuItem value={900000}>{t("time.fifteenMinutes")}</MenuItem>
								<MenuItem value={1800000}>{t("time.thirtyMinutes")}</MenuItem>
							</Select>
						)}
					/>
				}
			/>

			{/* Incidents ConfigBox */}
			<ConfigBox
				title={t("pages.createMonitor.form.incidents.title")}
				subtitle={t("pages.createMonitor.form.incidents.description")}
				rightContent={
					<Stack spacing={theme.spacing(12)}>
						<Controller
							name="statusWindowSize"
							control={control}
							render={({ field }) => (
								<SliderWithLabel
									{...field}
									sliderMaxWidth={{ xs: "100%", md: "50%" }}
									fieldLabel={t("pages.createMonitor.form.incidents.option.checks.label")}
									min={1}
									max={25}
									valueLabelDisplay="auto"
								/>
							)}
						/>
						<Controller
							name="statusWindowThreshold"
							control={control}
							render={({ field }) => (
								<SliderWithLabel
									{...field}
									sliderMaxWidth={{ xs: "100%", md: "50%" }}
									fieldLabel={t(
										"pages.createMonitor.form.incidents.option.percentage.label"
									)}
									min={1}
									max={100}
									valueLabelDisplay="auto"
								/>
							)}
						/>
					</Stack>
				}
			/>

			{/* Notifications ConfigBox */}
			<ConfigBox
				title={t("pages.createMonitor.form.notifications.title")}
				subtitle={t("pages.createMonitor.form.notifications.description")}
				rightContent={
					<Controller
						name="notifications"
						control={control}
						render={({ field }) => {
							// Map notifications to have 'name' property for v2 Autocomplete
							const notificationOptions = (notifications ?? []).map((n) => ({
								...n,
								name: n.notificationName,
							}));
							const selectedNotifications = notificationOptions.filter((n) =>
								(field.value ?? []).includes(n.id)
							);
							return (
								<Stack spacing={theme.spacing(4)}>
									<Autocomplete
										multiple
										options={notificationOptions}
										value={selectedNotifications}
										getOptionLabel={(option) => option.name}
										onChange={(_: unknown, newValue: typeof notificationOptions) => {
											field.onChange(newValue.map((n) => n.id));
										}}
										isOptionEqualToValue={(option, value) => option.id === value.id}
									/>
									{selectedNotifications.length > 0 && (
										<Stack
											flex={1}
											width="100%"
										>
											{selectedNotifications.map((notification, index) => (
												<Stack
													direction="row"
													alignItems="center"
													key={notification.id}
													width="100%"
												>
													<Typography flexGrow={1}>
														{notification.notificationName}
													</Typography>
													<IconButton
														size="small"
														onClick={() => {
															field.onChange(
																(field.value ?? []).filter(
																	(id: string) => id !== notification.id
																)
															);
														}}
														aria-label="Remove notification"
													>
														<Trash2 size={16} />
													</IconButton>
													{index < selectedNotifications.length - 1 && <Divider />}
												</Stack>
											))}
										</Stack>
									)}
								</Stack>
							);
						}}
					/>
				}
			/>

			{/* TLS/SSL ConfigBox - only for HTTP monitors */}
			{watchedType === "http" && (
				<ConfigBox
					title={t("pages.createMonitor.form.ignoreTls.title")}
					subtitle={t("pages.createMonitor.form.ignoreTls.description")}
					rightContent={
						<Controller
							name="ignoreTlsErrors"
							control={control}
							render={({ field }) => (
								<Stack
									direction="row"
									alignItems="center"
									spacing={theme.spacing(2)}
								>
									<Switch
										checked={field.value ?? false}
										onChange={(e) => field.onChange(e.target.checked)}
									/>
									<Typography>
										{t("pages.createMonitor.form.ignoreTls.option.tls.label")}
									</Typography>
								</Stack>
							)}
						/>
					}
				/>
			)}

			{/* Submit Button */}
			<Stack
				direction="row"
				justifyContent="flex-end"
			>
				<Button
					loading={isSubmitting}
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

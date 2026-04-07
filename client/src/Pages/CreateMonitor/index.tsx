import { useMemo, useState } from "react";
import { useEffect } from "react";
import { logger } from "@/Utils/logger";
import { useParams, useLocation, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import { Trans, useTranslation } from "react-i18next";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import { Trash2 } from "lucide-react";
import { HeaderDeleteControls } from "@/Components/monitors";
import { GeoContinents } from "@/Types/GeoCheck";

import { BasePage, ConfigBox } from "@/Components/design-elements";
import {
	RadioWithDescription,
	Button,
	TextField,
	Select,
	Autocomplete,
	SwitchComponent as Switch,
	SliderWithLabel,
	Dialog,
} from "@/Components/inputs";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import { useGet, usePost, usePatch, useDelete } from "@/Hooks/UseApi";
import { useMonitorForm } from "@/Hooks/useMonitorForm";
import {
	type Monitor,
	type MonitorType,
	type GamesMap,
	supportsGeoCheck,
} from "@/Types/Monitor";
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
	showGrpcServiceName: boolean;
	showIgnoreTls: boolean;
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
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		ping: {
			urlLabel: t("pages.createMonitor.form.general.option.host.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.host.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		docker: {
			urlLabel: t("pages.createMonitor.form.general.option.container.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.container.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		port: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: true,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		game: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: true,
			showGameSelect: true,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		grpc: {
			urlLabel: t("pages.createMonitor.form.general.option.host.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.host.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: true,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: true,
			showIgnoreTls: true,
		},
		pagespeed: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		hardware: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: true,
			showGrpcServiceName: false,
			showIgnoreTls: false,
		},
		websocket: {
			urlLabel: t("pages.createMonitor.form.general.option.wsUrl.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.wsUrl.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: true,
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
	const defaultType: MonitorType =
		pageType === "pagespeed"
			? "pagespeed"
			: pageType === "hardware"
				? "hardware"
				: "http";

	const { data: existingMonitor, refetch: refetchMonitor } = useGet<Monitor>(
		isEditMode ? `/monitors/${monitorId}` : null
	);

	const { data: notifications } = useGet<Notification[]>("/notifications/team");
	const { data: games } = useGet<GamesMap>("/monitors/games");

	const { schema, defaults } = useMonitorForm({
		data: existingMonitor ?? null,
		defaultType,
	});

	const form = useForm<MonitorFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const { control, watch, handleSubmit, clearErrors, setValue } = form;

	useEffect(() => {
		form.reset(defaults);
	}, [defaults, form]);

	const watchedType = watch("type") as MonitorType;

	const watchedUseAdvancedMatching = watch("useAdvancedMatching") as boolean;
	const watchGeoCheckEnabled = watch("geoCheckEnabled") as boolean;
	const watchedEscalationLevels = watch("escalation.levels");

	useEffect(() => {
		clearErrors();
	}, [watchedType, clearErrors]);

	useEffect(() => {
		if (!watchedEscalationLevels || watchedEscalationLevels.length !== 1) {
			setValue(
				"escalation.levels",
				[
					watchedEscalationLevels?.[0] || {
						afterMinutes: 0,
						notificationIds: [],
					},
				],
				{ shouldDirty: true, shouldValidate: true }
			);
		}
	}, [watchedEscalationLevels, setValue]);

	const generalSettingsConfig = useMemo(
		() => getGeneralSettingsConfig(watchedType, t),
		[watchedType, t]
	);

	const notificationOptions = useMemo(
		() =>
			(notifications ?? []).map((n) => ({
				...n,
				name: n.notificationName,
			})),
		[notifications]
	);

	const { post, loading: isCreating } = usePost<MonitorFormData, Monitor>();
	const { patch, loading: isUpdating } = usePatch<MonitorFormData, Monitor>();
	const isSubmitting = isCreating || isUpdating;
	// Delete functionality
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const { deleteFn, loading: isDeleting } = useDelete();

	const handleDeleteClick = () => {
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!monitorId) return;
		await deleteFn(`/monitors/${monitorId}`);
		setIsDeleteDialogOpen(false);
		// Navigate based on page type
		if (pageType === "pagespeed") {
			navigate("/pagespeed");
		} else if (pageType === "hardware") {
			navigate("/infrastructure");
		} else {
			navigate("/uptime");
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteDialogOpen(false);
	};

	const onSubmit = async (data: MonitorFormData) => {
		let result;
		if (isEditMode && monitorId) {
			result = await patch(`/monitors/${monitorId}`, data);
		} else {
			result = await post("/monitors", data);
		}

		if (result?.success) {
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
		logger.debug("Monitor creation validation errors", errors);
	};

	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit(onSubmit, onError)}
		>
			<HeaderDeleteControls
				monitor={existingMonitor}
				isAdmin={true}
				refetch={refetchMonitor}
				onDelete={handleDeleteClick}
			/>
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
										sx={{ gap: theme.spacing(LAYOUT.MD) }}
									>
										<RadioWithDescription
											value="http"
											label={t("pages.common.monitors.monitorTypes.optionHttp")}
											description={t(
												"pages.createMonitor.form.type.optionHttpDescription"
											)}
										/>
										<RadioWithDescription
											value="ping"
											label={t("pages.common.monitors.monitorTypes.optionPing")}
											description={t(
												"pages.createMonitor.form.type.optionPingDescription"
											)}
										/>
										<RadioWithDescription
											value="docker"
											label={t("pages.common.monitors.monitorTypes.optionDocker")}
											description={t(
												"pages.createMonitor.form.type.optionDockerDescription"
											)}
										/>
										<RadioWithDescription
											value="port"
											label={t("pages.common.monitors.monitorTypes.optionPort")}
											description={t(
												"pages.createMonitor.form.type.optionPortDescription"
											)}
										/>
										<RadioWithDescription
											value="game"
											label={t("pages.common.monitors.monitorTypes.optionGame")}
											description={t(
												"pages.createMonitor.form.type.optionGameDescription"
											)}
										/>
										<RadioWithDescription
											value="grpc"
											label={t("pages.common.monitors.monitorTypes.optionGrpc")}
											description={t(
												"pages.createMonitor.form.type.optionGrpcDescription"
											)}
										/>
										<RadioWithDescription
											value="websocket"
											label={t("pages.common.monitors.monitorTypes.optionWebSocket")}
											description={t(
												"pages.createMonitor.form.type.optionWebSocketDescription"
											)}
										/>
									</RadioGroup>
								</FormControl>
							)}
						/>
					}
				/>
			)}

			<ConfigBox
				title={t("pages.createMonitor.form.general.title")}
				subtitle={t(`pages.createMonitor.form.general.description.${watchedType}`)}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
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
										value={field.value === 0 ? "" : field.value}
										onChange={(e) => {
											const val = e.target.value;
											field.onChange(val === "" ? 0 : Number(val));
										}}
										type="number"
										fieldLabel={t("pages.createMonitor.form.general.option.port.label")}
										placeholder={t(
											"pages.createMonitor.form.general.option.port.placeholder"
										)}
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
										fieldLabel={t("pages.createMonitor.form.general.option.game.label")}
										error={!!fieldState.error}
									>
										<MenuItem value="">
											{t("pages.createMonitor.form.general.option.game.placeholder")}{" "}
										</MenuItem>
										{games &&
											Object.entries(games).map(([key, game]) => (
												<MenuItem
													key={key}
													value={key}
												>
													{game.name}
												</MenuItem>
											))}
									</Select>
								)}
							/>
						)}

						{/* gRPC Service Name field - only for grpc type */}
						{generalSettingsConfig.showGrpcServiceName && (
							<Controller
								name="grpcServiceName"
								control={control}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										value={field.value ?? ""}
										type="text"
										fieldLabel={t(
											"pages.createMonitor.form.general.option.grpcServiceName.label"
										)}
										placeholder={t(
											"pages.createMonitor.form.general.option.grpcServiceName.placeholder"
										)}
										fullWidth
										error={!!fieldState.error}
										helperText={fieldState.error?.message ?? ""}
									/>
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
								<MenuItem value={15000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.fifteenSeconds"
									)}
								</MenuItem>
								<MenuItem value={30000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.thirtySeconds"
									)}
								</MenuItem>
								<MenuItem value={60000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.oneMinute"
									)}
								</MenuItem>
								<MenuItem value={120000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.twoMinutes"
									)}
								</MenuItem>
								<MenuItem value={180000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.threeMinutes"
									)}
								</MenuItem>
								<MenuItem value={240000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.fourMinutes"
									)}
								</MenuItem>
								<MenuItem value={300000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.fiveMinutes"
									)}
								</MenuItem>
								<MenuItem value={600000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.tenMinutes"
									)}
								</MenuItem>
								<MenuItem value={900000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.fifteenMinutes"
									)}
								</MenuItem>
								<MenuItem value={1800000}>
									{t(
										"pages.createMonitor.form.frequency.option.frequency.value.thirtyMinutes"
									)}
								</MenuItem>
							</Select>
						)}
					/>
				}
			/>

			{/* Alert Thresholds - only for hardware type */}
			{generalSettingsConfig.showSecret && (
				<ConfigBox
					title={t("pages.createMonitor.form.thresholds.title")}
					subtitle={t("pages.createMonitor.form.thresholds.description")}
					rightContent={
						<Stack spacing={theme.spacing(LAYOUT.MD)}>
							<Controller
								name="cpuAlertThreshold"
								control={control}
								render={({ field }) => (
									<SliderWithLabel
										{...field}
										sliderMaxWidth={{ xs: "100%", md: "50%" }}
										fieldLabel={t(
											"pages.createMonitor.form.thresholds.option.cpuThreshold.label"
										)}
										min={0}
										max={100}
										step={1}
										valueLabelDisplay="auto"
										valueLabelFormat={(value) => `${value}%`}
									/>
								)}
							/>
							<Controller
								name="memoryAlertThreshold"
								control={control}
								render={({ field }) => (
									<SliderWithLabel
										{...field}
										sliderMaxWidth={{ xs: "100%", md: "50%" }}
										fieldLabel={t(
											"pages.createMonitor.form.thresholds.option.memoryThreshold.label"
										)}
										min={0}
										max={100}
										step={1}
										valueLabelDisplay="auto"
										valueLabelFormat={(value) => `${value}%`}
									/>
								)}
							/>
							<Controller
								name="diskAlertThreshold"
								control={control}
								render={({ field }) => (
									<SliderWithLabel
										{...field}
										sliderMaxWidth={{ xs: "100%", md: "50%" }}
										fieldLabel={t(
											"pages.createMonitor.form.thresholds.option.diskThreshold.label"
										)}
										min={0}
										max={100}
										step={1}
										valueLabelDisplay="auto"
										valueLabelFormat={(value) => `${value}%`}
									/>
								)}
							/>
							<Controller
								name="tempAlertThreshold"
								control={control}
								render={({ field }) => (
									<SliderWithLabel
										{...field}
										sliderMaxWidth={{ xs: "100%", md: "50%" }}
										fieldLabel={t(
											"pages.createMonitor.form.thresholds.option.tempThreshold.label"
										)}
										min={0}
										max={100}
										step={1}
										valueLabelDisplay="auto"
										valueLabelFormat={(value) => `${value}°C`}
									/>
								)}
							/>
						</Stack>
					}
				/>
			)}

			<ConfigBox
				title={t("pages.createMonitor.form.incidents.title")}
				subtitle={t("pages.createMonitor.form.incidents.description")}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
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

			<ConfigBox
				title={t("pages.createMonitor.form.notifications.title")}
				subtitle={t("pages.createMonitor.form.notifications.description")}
				rightContent={
					<Controller
						name="notifications"
						control={control}
						render={({ field }) => {
							const selectedNotifications = notificationOptions.filter((n) =>
								(field.value ?? []).includes(n.id)
							);
							return (
								<Stack spacing={theme.spacing(LAYOUT.MD)}>
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

			<ConfigBox
				title={t("pages.createMonitor.form.escalation.title")}
				subtitle={t("pages.createMonitor.form.escalation.description")}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Controller
							name="escalation.enabled"
							control={control}
							render={({ field }) => {
								if (field.value !== true) {
									field.onChange(true);
								}
								return <></>;
							}}
						/>

						<Controller
							name="escalation.levels"
							control={control}
							render={({ field, fieldState }) => {
								const levels = field.value ?? [];
								const level = levels[0] ?? { afterMinutes: 0, notificationIds: [] };
								const selectedLevelNotifications = notificationOptions.filter((n) =>
									(level.notificationIds ?? []).includes(n.id)
								);
								return (
									<Stack spacing={theme.spacing(LAYOUT.MD)}>
										<TextField
											type="number"
											value={String(level.afterMinutes ?? 0)}
											onChange={(e) => {
												field.onChange([
													{
														...level,
														afterMinutes: Number(e.target.value || 0),
													},
												]);
											}}
											fieldLabel={t(
												"pages.createMonitor.form.escalation.option.afterMinutes.label"
											)}
										/>

										<Typography>
											{t("pages.createMonitor.form.escalation.option.channelsLabel")}
										</Typography>

										<Autocomplete
											multiple
											options={notificationOptions}
											value={selectedLevelNotifications}
											getOptionLabel={(option) => option.name}
											onChange={(_: unknown, newValue: typeof notificationOptions) => {
												field.onChange([
													{
														...level,
														notificationIds: newValue.map((n) => n.id),
													},
												]);
											}}
											isOptionEqualToValue={(option, value) => option.id === value.id}
										/>

										{selectedLevelNotifications.length > 0 && (
											<Stack
												flex={1}
												width="100%"
											>
												{selectedLevelNotifications.map((notification, index) => (
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
																field.onChange([
																	{
																		...level,
																		notificationIds: (level.notificationIds ?? []).filter(
																			(id: string) => id !== notification.id
																		),
																	},
																]);
															}}
															aria-label="Remove escalation notification"
														>
															<Trash2 size={16} />
														</IconButton>
														{index < selectedLevelNotifications.length - 1 && <Divider />}
													</Stack>
												))}
											</Stack>
										)}

										{fieldState.error?.message && (
											<Typography color="error.main">
												{fieldState.error.message}
											</Typography>
										)}
									</Stack>
								);
							}}
						/>
					</Stack>
				}
			/>

			{(watchedType === "http" ||
				watchedType === "grpc" ||
				watchedType === "websocket") && (
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
									spacing={theme.spacing(SPACING.LG)}
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

			{watchedType === "http" && (
				<ConfigBox
					title={t("pages.createMonitor.form.advanced.title")}
					subtitle={t("pages.createMonitor.form.advanced.description")}
					rightContent={
						<Stack spacing={theme.spacing(LAYOUT.MD)}>
							<Controller
								name="useAdvancedMatching"
								control={control}
								render={({ field }) => (
									<Stack
										direction="row"
										alignItems="center"
										spacing={theme.spacing(SPACING.LG)}
									>
										<Switch
											checked={field.value ?? false}
											onChange={(e) => field.onChange(e.target.checked)}
										/>
										<Typography>
											{t(
												"pages.createMonitor.form.advanced.option.advancedMatching.label"
											)}
										</Typography>
									</Stack>
								)}
							/>
							{watchedUseAdvancedMatching && (
								<Stack spacing={theme.spacing(LAYOUT.MD)}>
									<Controller
										name="matchMethod"
										control={control}
										render={({ field }) => (
											<Select
												{...field}
												value={field.value ?? "equal"}
												fieldLabel={t(
													"pages.createMonitor.form.advanced.option.matchMethod.label"
												)}
											>
												<MenuItem value="equal">
													{t(
														"pages.createMonitor.form.advanced.option.matchMethod.equal"
													)}
												</MenuItem>
												<MenuItem value="include">
													{t(
														"pages.createMonitor.form.advanced.option.matchMethod.include"
													)}
												</MenuItem>
												<MenuItem value="regex">
													{t(
														"pages.createMonitor.form.advanced.option.matchMethod.regex"
													)}
												</MenuItem>
											</Select>
										)}
									/>
									<Controller
										name="expectedValue"
										control={control}
										render={({ field, fieldState }) => (
											<TextField
												{...field}
												value={field.value ?? ""}
												fieldLabel={t(
													"pages.createMonitor.form.advanced.option.expectedValue.label"
												)}
												fullWidth
												error={!!fieldState.error}
												helperText={fieldState.error?.message ?? ""}
											/>
										)}
									/>
									<Controller
										name="jsonPath"
										control={control}
										render={({ field, fieldState }) => (
											<TextField
												{...field}
												value={field.value ?? ""}
												fieldLabel={t(
													"pages.createMonitor.form.advanced.option.jsonPath.label"
												)}
												fullWidth
												error={!!fieldState.error}
												helperText={fieldState.error?.message ?? ""}
											/>
										)}
									/>
									<Typography
										component="span"
										color="text.secondary"
										sx={{ opacity: 0.8 }}
									>
										<Trans
											i18nKey="pages.createMonitor.form.advanced.option.jsonPath.description"
											components={{
												jmesLink: (
													<Link
														href="https://jmespath.org/"
														target="_blank"
														rel="noopener noreferrer"
													/>
												),
											}}
										/>
									</Typography>
								</Stack>
							)}
						</Stack>
					}
				/>
			)}

			{supportsGeoCheck(watchedType) && (
				<ConfigBox
					title={t("pages.createMonitor.form.geoChecks.title")}
					subtitle={t("pages.createMonitor.form.geoChecks.description")}
					rightContent={
						<Stack spacing={theme.spacing(LAYOUT.MD)}>
							<Controller
								name="geoCheckEnabled"
								control={control}
								render={({ field }) => (
									<Stack
										direction="row"
										alignItems="center"
										spacing={theme.spacing(SPACING.LG)}
									>
										<Switch
											checked={field.value ?? false}
											onChange={(e) => field.onChange(e.target.checked)}
										/>
										<Typography>
											{t("pages.createMonitor.form.geoChecks.option.enabled.label")}
										</Typography>
									</Stack>
								)}
							/>
							{watchGeoCheckEnabled && (
								<Stack spacing={theme.spacing(LAYOUT.MD)}>
									<Controller
										name="geoCheckLocations"
										control={control}
										render={({ field }) => {
											// Map continents to have 'name' property for Autocomplete
											const locationOptions = GeoContinents.map((continent) => ({
												id: continent,
												name: t(
													`pages.createMonitor.form.geoChecks.option.locations.options.${continent}`
												),
											}));
											const selectedLocations = locationOptions.filter((loc) =>
												(field.value ?? []).includes(loc.id)
											);
											return (
												<Stack spacing={theme.spacing(LAYOUT.MD)}>
													<Autocomplete
														multiple
														options={locationOptions}
														value={selectedLocations}
														getOptionLabel={(option) => option.name}
														onChange={(_: unknown, newValue: typeof locationOptions) => {
															field.onChange(newValue.map((loc) => loc.id));
														}}
														isOptionEqualToValue={(option, value) =>
															option.id === value.id
														}
														fieldLabel={t(
															"pages.createMonitor.form.geoChecks.option.locations.label"
														)}
													/>
													{selectedLocations.length > 0 && (
														<Stack
															flex={1}
															width="100%"
														>
															{selectedLocations.map((location, index) => (
																<Stack
																	direction="row"
																	alignItems="center"
																	key={location.id}
																	width="100%"
																>
																	<Typography flexGrow={1}>{location.name}</Typography>
																	<IconButton
																		size="small"
																		onClick={() => {
																			field.onChange(
																				(field.value ?? []).filter(
																					(id: string) => id !== location.id
																				)
																			);
																		}}
																		aria-label="Remove location"
																	>
																		<Trash2 size={16} />
																	</IconButton>
																	{index < selectedLocations.length - 1 && <Divider />}
																</Stack>
															))}
														</Stack>
													)}
												</Stack>
											);
										}}
									/>
									<Controller
										name="geoCheckInterval"
										control={control}
										render={({ field }) => (
											<Select
												{...field}
												value={field.value ?? 300000}
												fieldLabel={t(
													"pages.createMonitor.form.geoChecks.option.interval.label"
												)}
											>
												<MenuItem value={300000}>
													{t(
														"pages.createMonitor.form.geoChecks.option.interval.value.fiveMinutes"
													)}
												</MenuItem>
												<MenuItem value={600000}>
													{t(
														"pages.createMonitor.form.geoChecks.option.interval.value.tenMinutes"
													)}
												</MenuItem>
												<MenuItem value={900000}>
													{t(
														"pages.createMonitor.form.geoChecks.option.interval.value.fifteenMinutes"
													)}
												</MenuItem>
												<MenuItem value={1800000}>
													{t(
														"pages.createMonitor.form.geoChecks.option.interval.value.thirtyMinutes"
													)}
												</MenuItem>
											</Select>
										)}
									/>
								</Stack>
							)}
						</Stack>
					}
				/>
			)}

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
			<Dialog
				open={isDeleteDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={handleDeleteConfirm}
				onCancel={handleDeleteCancel}
				loading={isDeleting}
			/>
		</BasePage>
	);
};

export default CreateMonitorPage;
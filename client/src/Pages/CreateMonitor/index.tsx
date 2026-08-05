import { useMemo, useState } from "react";
import { useEffect } from "react";
import { logger } from "@/Utils/logger";
import { ALL_HTTP_STATUS_CODES } from "@/Utils/statusCode";
import { useParams, useLocation, useNavigate } from "react-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { Trans, useTranslation } from "react-i18next";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { HeaderDeleteControls } from "@/Components/monitors";
import { GeoContinents } from "@/Types/GeoCheck";

import Box from "@mui/material/Box";
import {
	BasePage,
	ColoredLabel,
	ConfigBox,
	StepProgress,
} from "@/Components/design-elements";
import {
	Button,
	Select,
	SwitchComponent as Switch,
	SliderWithLabel,
	Dialog,
} from "@/Components/inputs";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import { useGet, usePost, usePatch, useDelete } from "@/Hooks/UseApi";
import { useMonitorForm, getMonitorDefaults } from "@/Hooks/useMonitorForm";
import {
	type Monitor,
	type MonitorType,
	type GamesMap,
	type HttpMethod,
	supportsGeoCheck,
	DefaultPageSpeedStrategy,
	DefaultHttpMethod,
	HttpMethods,
	SelectableMonitorTypes,
	monitorTypeLabelKey,
} from "@/Types/Monitor";
import type { Notification } from "@/Types/Notification";
import type { Tag } from "@/Types/Tag";
import {
	stepFieldsFor,
	monitorStepCount,
	type MonitorFormData,
} from "@/Validation/monitor";
import { FormNumberField } from "@/Components/inputs/forms/FormNumberField";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormRadioGroup } from "@/Components/inputs/forms/FormRadioGroupField";
import { FormMultiSelectField } from "@/Components/inputs/forms/FormMultiSelectField";

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
	showStrategy: boolean;
	showDnsServer: boolean;
	showDnsRecordType: boolean;
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: true,
			showDnsServer: false,
			showDnsRecordType: false,
		},
		hardware: {
			urlLabel: t("pages.createMonitor.form.general.option.captureUrl.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.captureUrl.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: true,
			showGrpcServiceName: false,
			showIgnoreTls: false,
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
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
			showStrategy: false,
			showDnsServer: false,
			showDnsRecordType: false,
		},
		dns: {
			urlLabel: t("pages.createMonitor.form.general.option.url.label"),
			urlPlaceholder: t("pages.createMonitor.form.general.option.url.placeholder"),
			namePlaceholder: t("pages.createMonitor.form.general.option.name.placeholder"),
			showUrl: true,
			showPort: false,
			showGameSelect: false,
			showSecret: false,
			showGrpcServiceName: false,
			showIgnoreTls: false,
			showStrategy: false,
			showDnsServer: true,
			showDnsRecordType: true,
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
	const { data: tags } = useGet<Tag[]>("/tags/team");

	const { schema, defaults } = useMonitorForm({
		data: existingMonitor ?? null,
		defaultType,
	});

	const form = useForm<MonitorFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const { control, watch, handleSubmit, clearErrors, trigger, reset, setValue } = form;

	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	// Multi-step wizard on every create flow; edit mode keeps the flat form
	// where showStep() is always true.
	const [currentStep, setCurrentStep] = useState(0);
	const showStep = (step: number) => isEditMode || currentStep === step;

	const watchedType = watch("type") as MonitorType;
	const watchedMethod = watch("method") as HttpMethod | undefined;
	const watchedUseAdvancedMatching = watch("useAdvancedMatching") as boolean;
	const watchGeoCheckEnabled = watch("geoCheckEnabled") as boolean;

	// Steps without an advanced section drop it, so the last step is the form's.
	const totalSteps = monitorStepCount(watchedType);

	const handleNext = async () => {
		const isValid = await trigger(stepFieldsFor(watchedType, currentStep));
		if (isValid) {
			setCurrentStep((step) => step + 1);
		}
	};
	const handleBack = () => setCurrentStep((step) => step - 1);

	// Reset the form when the monitor type changes so stale type-specific fields
	// can't produce an invalid monitor. Type can only be changed on step 0.
	useEffect(() => {
		if (showTypeSelector) {
			reset(getMonitorDefaults(watchedType));
		} else {
			clearErrors();
		}
	}, [watchedType, showTypeSelector, reset, clearErrors]);

	const generalSettingsConfig = useMemo(
		() => getGeneralSettingsConfig(watchedType, t),
		[watchedType, t]
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

	const notificationOptions = useMemo(() => {
		return (notifications ?? []).map((n) => ({
			...n,
			name: n.notificationName,
		}));
	}, [notifications]);

	const locationOptions = useMemo(
		() =>
			GeoContinents.map((continent) => ({
				id: continent,
				name: t(
					`pages.createMonitor.form.geoChecks.option.locations.options.${continent}`
				),
			})),
		[t]
	);

	return (
		<FormProvider {...form}>
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
				{!isEditMode && (
					<StepProgress
						steps={totalSteps}
						current={currentStep}
					/>
				)}
				{/* Monitor Type Selection - only shown for uptime monitors */}
				{showTypeSelector && showStep(0) && (
					<ConfigBox
						title={t("pages.createMonitor.form.type.title")}
						subtitle={t("pages.createMonitor.form.type.description")}
						rightContent={
							<FormRadioGroup
								name={"type"}
								options={SelectableMonitorTypes.map((type) => ({
									value: type,
									label: t(
										`pages.common.monitors.monitorTypes.${monitorTypeLabelKey[type]}`
									),
									description: t(
										`pages.createMonitor.form.type.${monitorTypeLabelKey[type]}Description`
									),
								}))}
							/>
						}
					/>
				)}

				{showStep(0) && (
					<ConfigBox
						title={t("pages.createMonitor.form.general.title")}
						subtitle={
							<Trans
								i18nKey={`pages.createMonitor.form.general.description.${watchedType}`}
								components={{
									gamedigLink: (
										<Link
											href="https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md"
											target="_blank"
											rel="noopener noreferrer"
										/>
									),
								}}
							/>
						}
						rightContent={
							<Stack spacing={theme.spacing(LAYOUT.MD)}>
								{/* URL/Host/Container field - not shown for hardware */}
								{generalSettingsConfig.showUrl && (
									<FormTextField
										name="url"
										fieldLabel={generalSettingsConfig.urlLabel}
										placeholder={generalSettingsConfig.urlPlaceholder}
										disabled={isEditMode}
									/>
								)}

								{/* Strategy field - only for pagespeed type */}
								{generalSettingsConfig.showStrategy && (
									<Controller
										name="strategy"
										control={control}
										render={({ field, fieldState }) => (
											<Select
												{...field}
												value={field.value ?? DefaultPageSpeedStrategy}
												fieldLabel={t(
													"pages.createMonitor.form.general.option.strategy.label"
												)}
												error={!!fieldState.error}
											>
												<MenuItem value="desktop">
													{t("pages.createMonitor.form.general.option.strategy.desktop")}
												</MenuItem>
												<MenuItem value="mobile">
													{t("pages.createMonitor.form.general.option.strategy.mobile")}
												</MenuItem>
											</Select>
										)}
									/>
								)}

								{/* Port field - only for port and game types */}
								{generalSettingsConfig.showPort && (
									<FormNumberField
										name={"port"}
										fieldLabel={t("pages.createMonitor.form.general.option.port.label")}
										placeholder={t(
											"pages.createMonitor.form.general.option.port.placeholder"
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
												fieldLabel={t(
													"pages.createMonitor.form.general.option.game.label"
												)}
												error={!!fieldState.error}
											>
												<MenuItem value="">
													{t(
														"pages.createMonitor.form.general.option.game.placeholder"
													)}{" "}
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
									<FormTextField
										name="grpcServiceName"
										fieldLabel={t(
											"pages.createMonitor.form.general.option.grpcServiceName.label"
										)}
										placeholder={t(
											"pages.createMonitor.form.general.option.grpcServiceName.placeholder"
										)}
									/>
								)}

								{/* Secret field - only for hardware type */}
								{generalSettingsConfig.showSecret && (
									<FormTextField
										name="secret"
										fieldLabel={t("pages.createMonitor.form.general.option.secret.label")}
										placeholder={t(
											"pages.createMonitor.form.general.option.secret.placeholder"
										)}
									/>
								)}
								{generalSettingsConfig.showDnsServer && (
									<FormTextField
										name="dnsServer"
										fieldLabel={t(
											"pages.createMonitor.form.general.option.dnsServer.label"
										)}
										placeholder={t(
											"pages.createMonitor.form.general.option.dnsServer.placeholder"
										)}
									/>
								)}
								{generalSettingsConfig.showDnsRecordType && (
									<Controller
										name="dnsRecordType"
										control={control}
										defaultValue="A"
										render={({ field, fieldState }) => (
											<Select
												{...field}
												value={field.value ?? "A"}
												fieldLabel={t(
													"pages.createMonitor.form.general.option.dnsRecordType.label"
												)}
												error={!!fieldState.error}
											>
												<MenuItem value={"A"}>
													{t(
														"pages.createMonitor.form.general.option.dnsRecordType.value.A"
													)}
												</MenuItem>
												<MenuItem value={"AAAA"}>
													{t(
														"pages.createMonitor.form.general.option.dnsRecordType.value.AAAA"
													)}
												</MenuItem>
												<MenuItem value={"CNAME"}>
													{t(
														"pages.createMonitor.form.general.option.dnsRecordType.value.CNAME"
													)}
												</MenuItem>
												<MenuItem value={"MX"}>
													{t(
														"pages.createMonitor.form.general.option.dnsRecordType.value.MX"
													)}
												</MenuItem>
												<MenuItem value={"NS"}>
													{t(
														"pages.createMonitor.form.general.option.dnsRecordType.value.NS"
													)}
												</MenuItem>
												<MenuItem value={"TXT"}>
													{t(
														"pages.createMonitor.form.general.option.dnsRecordType.value.TXT"
													)}
												</MenuItem>
											</Select>
										)}
									/>
								)}
								<FormTextField
									name="name"
									fieldLabel={t("pages.createMonitor.form.general.option.name.label")}
									placeholder={generalSettingsConfig.namePlaceholder}
								/>
							</Stack>
						}
					/>
				)}

				{showStep(1) && (
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
				)}

				{/* Alert Thresholds - only for hardware type */}
				{generalSettingsConfig.showSecret && showStep(1) && (
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

				{showStep(1) && (
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
											fieldLabel={t(
												"pages.createMonitor.form.incidents.option.checks.label"
											)}
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
				)}

				{showStep(1) && (
					<ConfigBox
						title={t("pages.createMonitor.form.notifications.title")}
						subtitle={t("pages.createMonitor.form.notifications.description")}
						rightContent={
							<FormMultiSelectField
								name="notifications"
								options={notificationOptions}
							/>
						}
					/>
				)}

				{showStep(1) && (
					<ConfigBox
						title={t("pages.createMonitor.form.tags.title")}
						subtitle={t("pages.createMonitor.form.tags.description")}
						rightContent={
							<FormMultiSelectField
								name="tags"
								options={tags ?? []}
								renderRow={(tag) => (
									<Box flexGrow={1}>
										<ColoredLabel
											text={tag.name}
											color={tag.color}
										/>
									</Box>
								)}
								renderOptionContent={(option) => (
									<ColoredLabel
										text={option.name}
										color={option.color}
									/>
								)}
							/>
						}
					/>
				)}

				{showStep(2) &&
					(watchedType === "http" ||
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

				{showStep(2) && watchedType === "http" && (
					<ConfigBox
						title={t("pages.createMonitor.form.advanced.title")}
						subtitle={t("pages.createMonitor.form.advanced.description")}
						rightContent={
							<Stack spacing={theme.spacing(LAYOUT.MD)}>
								<Controller
									name="method"
									control={control}
									render={({ field }) => (
										<Stack spacing={theme.spacing(LAYOUT.MD)}>
											<Select
												{...field}
												value={field.value ?? DefaultHttpMethod}
												onChange={(e) => {
													const value = e.target.value as HttpMethod;
													field.onChange(value);
													// HEAD has no response body, reset advanced matching fields if selected
													if (value === "HEAD") {
														setValue("useAdvancedMatching", false);
														setValue("matchMethod", "");
														setValue("expectedValue", "");
														setValue("jsonPath", "");
													}
												}}
												fieldLabel={t(
													"pages.createMonitor.form.advanced.option.method.label"
												)}
											>
												{HttpMethods.map((method) => (
													<MenuItem
														key={method}
														value={method}
													>
														{method}
													</MenuItem>
												))}
											</Select>
											<Typography
												component="span"
												color={theme.palette.text.secondary}
												sx={{ opacity: 0.8 }}
											>
												{t(
													`pages.createMonitor.form.advanced.option.method.description.${field.value ?? DefaultHttpMethod}`
												)}
											</Typography>
										</Stack>
									)}
								/>

								<FormMultiSelectField
									name="customUpCodes"
									options={ALL_HTTP_STATUS_CODES}
								/>

								{watchedMethod !== "HEAD" && (
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
								)}
								{watchedUseAdvancedMatching && watchedMethod !== "HEAD" && (
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

										<FormTextField
											name="expectedValue"
											fieldLabel={t(
												"pages.createMonitor.form.advanced.option.expectedValue.label"
											)}
										/>

										<FormTextField
											name="jsonPath"
											fieldLabel={t(
												"pages.createMonitor.form.advanced.option.jsonPath.label"
											)}
										/>

										<Typography
											component="span"
											color={theme.palette.text.secondary}
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

				{showStep(2) && supportsGeoCheck(watchedType) && (
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
										<FormMultiSelectField
											name="geoCheckLocations"
											options={locationOptions}
											fieldLabel={t(
												"pages.createMonitor.form.geoChecks.option.locations.label"
											)}
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
					justifyContent={!isEditMode ? "space-between" : "flex-end"}
				>
					{!isEditMode && (
						<Button
							type="button"
							variant="outlined"
							color="secondary"
							disabled={currentStep === 0}
							onClick={handleBack}
						>
							{t("common.buttons.back")}
						</Button>
					)}
					{!isEditMode && currentStep < totalSteps - 1 ? (
						<Button
							key="wizard-next"
							type="button"
							variant="contained"
							color="primary"
							onClick={handleNext}
						>
							{t("common.buttons.next")}
						</Button>
					) : (
						<Button
							key="wizard-save"
							loading={isSubmitting}
							type="submit"
							variant="contained"
							color="primary"
						>
							{t("common.buttons.save")}
						</Button>
					)}
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
		</FormProvider>
	);
};

export default CreateMonitorPage;

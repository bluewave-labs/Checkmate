import { useMemo, useState } from "react";
import { useEffect } from "react";
import { logger } from "@/Utils/logger";
import { ALL_HTTP_STATUS_CODES } from "@/Utils/statusCode";
import { useParams, useLocation, useNavigate } from "react-router";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { Trans, useTranslation } from "react-i18next";
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
import { Button, Dialog } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
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
	PageSpeedStrategies,
	DnsRecordTypes,
	MonitorIntervalOptions,
	MIN_MONITOR_INTERVAL_MS,
	DefaultMonitorMatchMethod,
	MonitorMatchMethods,
	GeoCheckIntervalOptions,
	ProxyModes,
	type ProxyMode,
} from "@/Types/Monitor";
import type { Notification } from "@/Types/Notification";
import type { Tag } from "@/Types/Tag";
import type { AppSettingsResponse } from "@/Types/Settings";
import {
	stepFieldsFor,
	monitorStepCount,
	type MonitorFormData,
} from "@/Validation/monitor";
import { FormNumberField } from "@/Components/inputs/forms/FormNumberField";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormRadioGroup } from "@/Components/inputs/forms/FormRadioGroupField";
import { FormMultiSelectField } from "@/Components/inputs/forms/FormMultiSelectField";
import { FormSelectField } from "@/Components/inputs/forms/FormSelectField";
import {
	FormAutocompleteField,
	type AutocompleteOption,
} from "@/Components/inputs/forms/FormAutoCompleteField";
import { FormSliderField } from "@/Components/inputs/forms/FormSliderField";
import { FormSwitchField } from "@/Components/inputs/forms/FormSwitchField";
import type { ProxyResponse } from "@/Types/Proxy";
import { formatDuration } from "@/Utils/TimeUtils";

const httpMethodOptions = HttpMethods.map((method) => ({
	value: method,
	label: method,
}));

interface IntervalOption extends AutocompleteOption {
	id: number;
}

const INTERVAL_UNIT_MULTIPLIERS = [1000, 60000, 3600000, 86400000] as const;

const toIntervalOption = (intervalMs: number): IntervalOption => ({
	id: intervalMs,
	name: formatDuration(intervalMs, true),
});

const filterIntervalOptions = (
	options: IntervalOption[],
	inputValue: string
): IntervalOption[] => {
	const input = inputValue.trim();
	if (input === "" || options.some((option) => option.name === input)) {
		return options;
	}

	const amount = Number(input);
	if (!Number.isFinite(amount) || amount <= 0) {
		return [];
	}

	return INTERVAL_UNIT_MULTIPLIERS.map((multiplier) => amount * multiplier)
		.filter(Number.isSafeInteger)
		.map(toIntervalOption);
};

interface GeneralSettingsConfig {
	urlLabel: string;
	urlPlaceholder: string;
	namePlaceholder: string;
	showUrl: boolean;
	showProxy: boolean;
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
			showProxy: true,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
			showProxy: false,
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
	const { data: proxies } = useGet<ProxyResponse[]>("/proxies/team");
	const { data: appSettings } = useGet<AppSettingsResponse>("/settings");

	const { schema, defaults } = useMonitorForm({
		data: existingMonitor ?? null,
		defaultType,
	});

	const form = useForm<MonitorFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const { watch, handleSubmit, clearErrors, trigger, reset, setValue } = form;

	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	// Multi-step wizard on every create flow; edit mode keeps the flat form
	// where showStep() is always true.
	const [currentStep, setCurrentStep] = useState(0);
	const showStep = (step: number) => isEditMode || currentStep === step;

	const watchedType = watch("type") as MonitorType;
	const watchedMethod = watch("method") as HttpMethod | undefined;
	const watchedProxyMode = watch("proxyMode") as ProxyMode | undefined;
	const watchedUseAdvancedMatching = watch("useAdvancedMatching") as boolean;
	const watchGeoCheckEnabled = watch("geoCheckEnabled") as boolean;
	const watchedInterval = watch("interval");

	// Steps without an advanced section drop it, so the last step is the form's.
	const totalSteps = monitorStepCount(watchedType);

	const handleNext = async () => {
		const isValid = await trigger(stepFieldsFor(watchedType, currentStep));
		if (isValid) {
			setCurrentStep((step) => step + 1);
		}
	};

	const isWizardStep = !isEditMode && currentStep < totalSteps - 1;

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

	const handleFormSubmit = isWizardStep
		? (event: React.FormEvent) => {
				event.preventDefault();
				void handleNext();
			}
		: handleSubmit(onSubmit, onError);

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

	const typeOptions = useMemo(
		() =>
			SelectableMonitorTypes.map((type) => ({
				value: type,
				label: t(`pages.common.monitors.monitorTypes.${monitorTypeLabelKey[type]}`),
				description: t(
					`pages.createMonitor.form.type.${monitorTypeLabelKey[type]}Description`
				),
			})),
		[t]
	);

	const strategyOptions = useMemo(
		() =>
			PageSpeedStrategies.map((strategy) => ({
				value: strategy,
				label: t(`pages.createMonitor.form.general.option.strategy.${strategy}`),
			})),
		[t]
	);

	const gameOptions = useMemo(
		() => [
			{
				value: "",
				label: t("pages.createMonitor.form.general.option.game.placeholder"),
			},
			...Object.entries(games ?? {}).map(([key, game]) => ({
				value: key,
				label: game.name,
			})),
		],
		[games, t]
	);

	const dnsRecordTypeOptions = useMemo(
		() =>
			DnsRecordTypes.map((recordType) => ({
				value: recordType,
				label: t(
					`pages.createMonitor.form.general.option.dnsRecordType.value.${recordType}`
				),
			})),
		[t]
	);

	const intervalOptions = useMemo(() => {
		const options = MonitorIntervalOptions.map(({ value }) => toIntervalOption(value));
		if (
			typeof watchedInterval === "number" &&
			!options.some((option) => option.id === watchedInterval)
		) {
			options.push(toIntervalOption(watchedInterval));
		}
		return options;
	}, [watchedInterval]);

	const matchMethodOptions = useMemo(
		() =>
			MonitorMatchMethods.map((method) => ({
				value: method,
				label: t(`pages.createMonitor.form.advanced.option.matchMethod.${method}`),
			})),
		[t]
	);

	const geoCheckIntervalOptions = useMemo(
		() =>
			GeoCheckIntervalOptions.map((option) => ({
				value: option.value,
				label: t(
					`pages.createMonitor.form.geoChecks.option.interval.value.${option.labelKey}`
				),
			})),
		[t]
	);
	const globalProxyName = appSettings?.globalProxy?.name;

	const proxyModeOptions = useMemo(
		() =>
			ProxyModes.map((mode) => {
				const key =
					mode === "inherit"
						? globalProxyName
							? "inheritGlobal"
							: "inheritDirect"
						: mode;
				return {
					value: mode,
					label: t(`pages.createMonitor.form.general.option.proxyMode.value.${key}`, {
						name: globalProxyName,
					}),
					description: t(
						`pages.createMonitor.form.general.option.proxyMode.description.${key}`
					),
				};
			}),
		[t, globalProxyName]
	);

	const proxyOptions = useMemo(
		() =>
			(proxies ?? []).map((proxy) => ({
				value: proxy.id,
				label: `${proxy.name} (${proxy.host}:${proxy.port})`,
			})),
		[proxies]
	);

	return (
		<FormProvider {...form}>
			<BasePage
				component="form"
				onSubmit={handleFormSubmit}
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
								options={typeOptions}
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
								<FormTextField
									name="name"
									fieldLabel={t("pages.createMonitor.form.general.option.name.label")}
									placeholder={generalSettingsConfig.namePlaceholder}
								/>
								{/* URL/Host/Container field - not shown for hardware */}
								{generalSettingsConfig.showUrl && (
									<FormTextField
										name="url"
										fieldLabel={generalSettingsConfig.urlLabel}
										placeholder={generalSettingsConfig.urlPlaceholder}
										disabled={isEditMode}
									/>
								)}
								{/* Proxy fields - only shown for HTTP */}
								{generalSettingsConfig.showProxy && (
									<>
										<FormRadioGroup
											name="proxyMode"
											options={proxyModeOptions}
											fieldLabel={t(
												"pages.createMonitor.form.general.option.proxyMode.label"
											)}
										/>
										{watchedProxyMode === "custom" && (
											<FormSelectField
												name="proxyId"
												fieldLabel={t(
													"pages.createMonitor.form.general.option.proxy.label"
												)}
												options={proxyOptions}
											/>
										)}
									</>
								)}

								{/* Strategy field - only for pagespeed type */}
								{generalSettingsConfig.showStrategy && (
									<FormSelectField
										name="strategy"
										fieldLabel={t(
											"pages.createMonitor.form.general.option.strategy.label"
										)}
										options={strategyOptions}
										fallbackValue={DefaultPageSpeedStrategy}
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
									<FormSelectField
										name="gameId"
										fieldLabel={t("pages.createMonitor.form.general.option.game.label")}
										options={gameOptions}
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
									<FormSelectField
										name="dnsRecordType"
										fieldLabel={t(
											"pages.createMonitor.form.general.option.dnsRecordType.label"
										)}
										options={dnsRecordTypeOptions}
									/>
								)}
							</Stack>
						}
					/>
				)}

				{showStep(1) && (
					<ConfigBox
						title={t("pages.createMonitor.form.frequency.title")}
						subtitle={t("pages.createMonitor.form.frequency.description")}
						rightContent={
							<FormAutocompleteField
								name="interval"
								fieldLabel={t(
									"pages.createMonitor.form.frequency.option.frequency.label"
								)}
								options={intervalOptions}
								filterOptions={(options, { inputValue }) =>
									filterIntervalOptions(options, inputValue)
								}
								getOptionDisabled={(option) => option.id < MIN_MONITOR_INTERVAL_MS}
								disableClearable
							/>
						}
					/>
				)}

				{/* Alert Thresholds - only for hardware type */}
				{watchedType === "hardware" && showStep(1) && (
					<ConfigBox
						title={t("pages.createMonitor.form.thresholds.title")}
						subtitle={t("pages.createMonitor.form.thresholds.description")}
						rightContent={
							<Stack spacing={theme.spacing(LAYOUT.MD)}>
								<FormSliderField
									name="cpuAlertThreshold"
									fieldLabel={t(
										"pages.createMonitor.form.thresholds.option.cpuThreshold.label"
									)}
									min={0}
									max={100}
									step={1}
									valueLabelDisplay="auto"
									valueLabelFormat={(value) => `${value}%`}
								/>
								<FormSliderField
									name="memoryAlertThreshold"
									fieldLabel={t(
										"pages.createMonitor.form.thresholds.option.memoryThreshold.label"
									)}
									min={0}
									max={100}
									step={1}
									valueLabelDisplay="auto"
									valueLabelFormat={(value) => `${value}%`}
								/>
								<FormSliderField
									name="diskAlertThreshold"
									fieldLabel={t(
										"pages.createMonitor.form.thresholds.option.diskThreshold.label"
									)}
									min={0}
									max={100}
									step={1}
									valueLabelDisplay="auto"
									valueLabelFormat={(value) => `${value}%`}
								/>
								<FormSliderField
									name="tempAlertThreshold"
									fieldLabel={t(
										"pages.createMonitor.form.thresholds.option.tempThreshold.label"
									)}
									min={0}
									max={100}
									step={1}
									valueLabelDisplay="auto"
									valueLabelFormat={(value) => `${value}°C`}
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
								<FormSliderField
									name="statusWindowSize"
									fieldLabel={t("pages.createMonitor.form.incidents.option.checks.label")}
									min={1}
									max={25}
									valueLabelDisplay="auto"
								/>
								<FormSliderField
									name="statusWindowThreshold"
									fieldLabel={t(
										"pages.createMonitor.form.incidents.option.percentage.label"
									)}
									min={1}
									max={100}
									valueLabelDisplay="auto"
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
								<FormSwitchField
									name="ignoreTlsErrors"
									label={t("pages.createMonitor.form.ignoreTls.option.tls.label")}
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
								<FormSelectField
									name="method"
									fieldLabel={t("pages.createMonitor.form.advanced.option.method.label")}
									fallbackValue={DefaultHttpMethod}
									onValueChange={(value) => {
										// HEAD has no response body, reset advanced matching fields if selected
										if (value === "HEAD") {
											setValue("useAdvancedMatching", false);
											setValue("matchMethod", DefaultMonitorMatchMethod);
											setValue("expectedValue", "");
											setValue("jsonPath", "");
										}
									}}
									options={httpMethodOptions}
								/>
								<Typography
									component="span"
									color={theme.palette.text.secondary}
									sx={{ opacity: 0.8 }}
								>
									{t(
										`pages.createMonitor.form.advanced.option.method.description.${watchedMethod}`
									)}
								</Typography>

								<FormMultiSelectField
									name="customUpCodes"
									options={ALL_HTTP_STATUS_CODES}
									fieldLabel={t(
										"pages.createMonitor.form.advanced.option.customUpCodes.label"
									)}
									description={t(
										"pages.createMonitor.form.advanced.option.customUpCodes.description"
									)}
								/>

								{watchedMethod !== "HEAD" && (
									<FormSwitchField
										name="useAdvancedMatching"
										label={t(
											"pages.createMonitor.form.advanced.option.advancedMatching.label"
										)}
									/>
								)}
								{watchedUseAdvancedMatching && watchedMethod !== "HEAD" && (
									<Stack spacing={theme.spacing(LAYOUT.MD)}>
										<FormSelectField
											name="matchMethod"
											fieldLabel={t(
												"pages.createMonitor.form.advanced.option.matchMethod.label"
											)}
											fallbackValue={DefaultMonitorMatchMethod}
											options={matchMethodOptions}
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
								<FormSwitchField
									name="geoCheckEnabled"
									label={t("pages.createMonitor.form.geoChecks.option.enabled.label")}
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
										<FormSelectField
											name="geoCheckInterval"
											fieldLabel={t(
												"pages.createMonitor.form.geoChecks.option.interval.label"
											)}
											options={geoCheckIntervalOptions}
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
							type="submit"
							variant="contained"
							color="primary"
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

import { BasePage, ConfigBox, StepProgress } from "@/Components/design-elements";
import Stack from "@mui/material/Stack";
import { logger } from "@/Utils/logger";
import { LAYOUT } from "@/Utils/Theme/constants";
import Typography from "@mui/material/Typography";
import { ImageUpload, Button, Dialog } from "@/Components/inputs";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStatusPageForm } from "@/Hooks/useStatusPageForm";
import type { StatusPageFormData } from "@/Validation/statusPage";
import { statusPageStepCount, statusPageStepFieldsFor } from "@/Validation/statusPage";
import { useGet, usePost, usePut, useDelete } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import type { MonitorDisplayType, StatusPageResponse } from "@/Types/StatusPage";
import { getMonitorTypeLabel } from "@/Types/StatusPage";
import { timezoneOptions } from "@/Utils/timezoneOptions";
import { useNavigate, useParams } from "react-router-dom";
import { mutate } from "swr";
import axios from "axios";
import { HeaderConfigStatusControls } from "./Components/HeaderConfigStatusControls";
import { ThemePicker } from "./Components/ThemePicker";
import { FormSwitchField } from "@/Components/inputs/forms/FormSwitchField";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormMultiSelectField } from "@/Components/inputs/forms/FormMultiSelectField";
import { FormAutocompleteField } from "@/Components/inputs/forms/FormAutoCompleteField";
import { FormCheckboxField } from "@/Components/inputs/forms/FormCheckboxField";
import { FormColorField } from "@/Components/inputs/forms/FormColorField";

const ThemePickerField = () => {
	const { field: themeField } = useController<StatusPageFormData, "theme">({
		name: "theme",
	});
	const { field: modeField } = useController<StatusPageFormData, "themeMode">({
		name: "themeMode",
	});
	return (
		<ThemePicker
			theme={themeField.value ?? "refined"}
			themeMode={modeField.value ?? "auto"}
			onThemeChange={themeField.onChange}
			onThemeModeChange={modeField.onChange}
		/>
	);
};
const LogoUploadField = () => {
	const { field } = useController<StatusPageFormData, "logo">({ name: "logo" });
	return (
		<ImageUpload
			src={field.value?.data}
			onChange={(file) => {
				field.onChange(file ? { data: file.src, contentType: file.file.type } : null);
			}}
		/>
	);
};

const monitorsUrl = (() => {
	const params = new URLSearchParams();
	["http", "ping", "port", "docker", "game", "grpc", "websocket", "hardware"].forEach(
		(type) => params.append("type", type)
	);
	return `/monitors/team?${params.toString()}`;
})();

const buildStatusPageKey = (slug: string | null | undefined) =>
	slug ? `/status-page/${slug}?type=uptime&type=infrastructure` : null;

const CreateStatusPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { url } = useParams<{ url: string }>();

	const isCreate = typeof url === "undefined";

	// Fetch existing status page data when configuring
	const { data: statusPageData, isLoading: isLoadingStatusPage } =
		useGet<StatusPageResponse>(isCreate ? null : buildStatusPageKey(url));

	const { data: monitorsResponse } = useGet<Monitor[]>(monitorsUrl);
	const monitors = useMemo(() => monitorsResponse ?? [], [monitorsResponse]);

	const { post, loading: isSubmittingPost } = usePost();
	const { put, loading: isSubmittingPut } = usePut();
	const { deleteFn, loading: isDeleting } = useDelete();

	// Delete dialog state
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const isSubmitting = isSubmittingPost || isSubmittingPut;

	const { schema, defaults } = useStatusPageForm({
		data: statusPageData?.statusPage ?? null,
		monitors: statusPageData?.monitors ?? null,
	});

	const form = useForm<StatusPageFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { reset, handleSubmit, trigger } = form;

	// Reset form when defaults change (from fetched data)
	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	// Multi-step wizard, create only. The configure (edit) flow keeps the flat
	// form, where showStep() is always true.
	const [currentStep, setCurrentStep] = useState(0);
	const showStep = (step: number) => !isCreate || currentStep === step;
	const totalSteps = statusPageStepCount();

	const handleNext = async () => {
		const isValid = await trigger(statusPageStepFieldsFor(currentStep));
		if (isValid) {
			setCurrentStep((step) => step + 1);
		}
	};
	const handleBack = () => setCurrentStep((step) => step - 1);

	const watchedMonitorIds: string[] = form.watch("monitors");
	const computedTypes: MonitorDisplayType[] = useMemo(() => {
		const selectedMonitors = (watchedMonitorIds ?? [])
			.map((id) => monitors.find((m) => m.id === id))
			.filter((m): m is Monitor => m !== undefined);

		const typesSet = new Set<MonitorDisplayType>();
		selectedMonitors.forEach((m) => {
			typesSet.add(m.type === "hardware" ? "infrastructure" : "uptime");
		});

		return typesSet.size ? Array.from(typesSet) : ["uptime"];
	}, [watchedMonitorIds, monitors]);

	useEffect(() => {
		form.setValue("type", computedTypes);
	}, [computedTypes, form]);

	const onError = (errors: any) => {
		logger.debug("Status page validation errors", errors);
	};

	const handleDeleteClick = () => {
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		const result = await deleteFn(`/status-page/${statusPageData?.statusPage?.id}`);
		if (result) {
			navigate("/status");
		}
		setIsDeleteDialogOpen(false);
	};

	const handleDeleteCancel = () => {
		setIsDeleteDialogOpen(false);
	};

	const onSubmit = async (data: StatusPageFormData) => {
		const fd = new FormData();
		fd.append("isPublished", String(data.isPublished));
		if (data.companyName) fd.append("companyName", data.companyName);
		if (data.url) fd.append("url", data.url);
		if (data.customDomain !== undefined && data.customDomain !== null) {
			fd.append("customDomain", data.customDomain);
		} else {
			fd.append("customDomain", "");
		}
		if (data.timezone) fd.append("timezone", data.timezone);
		if (data.color) fd.append("color", data.color);
		fd.append("showCharts", String(data.showCharts));
		fd.append("showUptimePercentage", String(data.showUptimePercentage));
		fd.append("showAdminLoginLink", String(data.showAdminLoginLink));
		fd.append("showInfrastructure", String(data.showInfrastructure));
		fd.append("customCSS", data.customCSS ?? "");
		if (data.theme) fd.append("theme", data.theme);
		if (data.themeMode) fd.append("themeMode", data.themeMode);

		data.monitors.forEach((monitorId) => {
			fd.append("monitors[]", monitorId);
		});

		data.type.forEach((type) => {
			fd.append("type[]", type);
		});

		// Handle logo upload
		if (data.logo === null) {
			// Signal to remove the logo
			fd.append("removeLogo", "true");
		} else if (data.logo?.data && data.logo.data !== "") {
			if (data.logo.data.startsWith("blob:")) {
				try {
					const imageResult = await axios.get(data.logo.data, {
						responseType: "blob",
					});
					fd.append("logo", imageResult.data);
					URL.revokeObjectURL(data.logo.data);
				} catch (e) {
					logger.error("Failed to fetch logo blob", e instanceof Error ? e : undefined);
				}
			}
		}

		let result;
		if (isCreate) {
			result = await post("/status-page", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});
		} else {
			result = await put(`/status-page/${statusPageData?.statusPage.id}`, fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});
		}

		if (result) {
			await mutate(buildStatusPageKey(data.url));
			if (!isCreate && url !== data.url) {
				await mutate(buildStatusPageKey(url));
			}
			navigate(`/status/${data.url}`);
		}
	};

	if (!isCreate && isLoadingStatusPage) {
		return <BasePage>Loading...</BasePage>;
	}
	return (
		<FormProvider {...form}>
			<BasePage
				component="form"
				onSubmit={handleSubmit(onSubmit, onError)}
			>
				{!isCreate && <HeaderConfigStatusControls onDelete={handleDeleteClick} />}
				{isCreate && (
					<StepProgress
						steps={totalSteps}
						current={currentStep}
					/>
				)}
				{showStep(0) && (
					<ConfigBox
						title={t("pages.statusPages.form.access.title")}
						subtitle={t("pages.statusPages.form.access.description")}
						rightContent={
							<FormSwitchField
								name="isPublished"
								label={t("pages.statusPages.form.access.option.published.name")}
							/>
						}
					/>
				)}
				{showStep(0) && (
					<ConfigBox
						title={t("pages.statusPages.form.basicInfo.title")}
						subtitle={t("pages.statusPages.form.basicInfo.description")}
						rightContent={
							<Stack spacing={theme.spacing(LAYOUT.MD)}>
								<FormTextField
									name="companyName"
									fieldLabel={t("pages.statusPages.form.basicInfo.option.name.label")}
									placeholder={t(
										"pages.statusPages.form.basicInfo.option.name.placeholder"
									)}
								/>

								<FormTextField
									name="url"
									fieldLabel={t("pages.statusPages.form.basicInfo.option.url.label")}
									placeholder={t(
										"pages.statusPages.form.basicInfo.option.url.placeholder"
									)}
								/>
								<FormTextField
									name="customDomain"
									fieldLabel={t(
										"pages.statusPages.form.basicInfo.option.customDomain.label"
									)}
									placeholder={t(
										"pages.statusPages.form.basicInfo.option.customDomain.placeholder"
									)}
									helperText={t(
										"pages.statusPages.form.basicInfo.option.customDomain.helper"
									)}
								/>
							</Stack>
						}
					/>
				)}
				{showStep(0) && (
					<ConfigBox
						title={t("pages.statusPages.form.monitors.title")}
						subtitle={t("pages.statusPages.form.monitors.description")}
						rightContent={
							<FormMultiSelectField
								sortable
								name="monitors"
								fieldLabel={t("pages.statusPages.form.monitors.option.monitors.label")}
								placeholder={t(
									"pages.statusPages.form.monitors.option.monitors.placeholder"
								)}
								options={monitors}
								renderRow={(monitor) => (
									<Typography flexGrow={1}>
										{`${monitor.name} (${getMonitorTypeLabel(monitor.type, t)})`}
									</Typography>
								)}
							/>
						}
					/>
				)}
				{showStep(0) && (
					<ConfigBox
						title={t("pages.statusPages.form.timezone.title")}
						subtitle={t("pages.statusPages.form.timezone.description")}
						rightContent={
							<FormAutocompleteField
								name="timezone"
								options={timezoneOptions}
								fieldLabel={t("pages.statusPages.form.timezone.option.timezone.label")}
								placeholder={t(
									"pages.statusPages.form.timezone.option.timezone.placeholder"
								)}
							/>
						}
					/>
				)}
				{showStep(1) && (
					<ConfigBox
						title={t("pages.statusPages.form.appearance.title")}
						subtitle={t("pages.statusPages.form.appearance.description")}
						rightContent={
							<Stack spacing={theme.spacing(LAYOUT.MD)}>
								<Stack alignItems={"center"}>
									<LogoUploadField />
								</Stack>
								<FormColorField
									name="color"
									fieldLabel={t("pages.statusPages.form.appearance.option.color.label")}
								/>
							</Stack>
						}
					/>
				)}
				{showStep(1) && (
					<ConfigBox
						title={t("pages.statusPages.form.theme.title")}
						subtitle={t("pages.statusPages.form.theme.description")}
						rightContent={<ThemePickerField />}
					/>
				)}
				{showStep(1) && (
					<ConfigBox
						title={t("pages.statusPages.form.customCSS.title")}
						subtitle={t("pages.statusPages.form.customCSS.description")}
						rightContent={
							<FormTextField
								name="customCSS"
								multiline
								rows={8}
								fieldLabel={t("pages.statusPages.form.customCSS.option.customCSS.label")}
								placeholder={t(
									"pages.statusPages.form.customCSS.option.customCSS.placeholder"
								)}
							/>
						}
					/>
				)}
				{showStep(1) && (
					<ConfigBox
						title={t("pages.statusPages.form.features.title")}
						subtitle={t("pages.statusPages.form.features.description")}
						rightContent={
							<Stack spacing={theme.spacing(LAYOUT.MD)}>
								<FormCheckboxField
									name="showCharts"
									label={t("pages.statusPages.form.features.option.showCharts.label")}
								/>
								<FormCheckboxField
									name="showInfrastructure"
									label={t(
										"pages.statusPages.form.features.option.showInfrastructure.label"
									)}
								/>
								{/* 
								<FormCheckboxField
									name="showUptimePercentage"
									label={t(
										"pages.statusPages.form.features.option.showUptimePercentage.label"
									)}
								/>

								<FormCheckboxField
									name="showAdminLoginLink"
									label={t(
										"pages.statusPages.form.features.option.showAdminLoginLink.label"
									)}
								/> */}
							</Stack>
						}
					/>
				)}
				<Stack
					direction="row"
					justifyContent={isCreate ? "space-between" : "flex-end"}
				>
					{isCreate && (
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
					{isCreate && currentStep < totalSteps - 1 ? (
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

export default CreateStatusPage;

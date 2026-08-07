import Stack from "@mui/material/Stack";
import { logger } from "@/Utils/logger";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import { BasePage, ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";
import type { MaintenanceWindowFormData } from "@/Validation/maintenanceWindow";
import { repeatOptions, durationUnitOptions } from "@/Validation/maintenanceWindow";
import { useMaintenanceWindowForm } from "@/Hooks/useMaintenanceWindowForm";
import { useGet, usePost, usePatch } from "@/Hooks/UseApi";
import { mutate } from "swr";
import { useParams, useNavigate } from "react-router-dom";
import type { Monitor } from "@/Types/Monitor";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormSelectField } from "@/Components/inputs/forms/FormSelectField";
import { FormDatePickerField } from "@/Components/inputs/forms/FormDatePickerField";
import { FormTimePickerField } from "@/Components/inputs/forms/FormTimePickerField";
import { FormMultiSelectField } from "@/Components/inputs/forms/FormMultiSelectField";
import { FormNumberField } from "@/Components/inputs/forms/FormNumberField";

const CreateMaintenanceWindowPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { maintenanceWindowId } = useParams<{ maintenanceWindowId: string }>();
	const isEditMode = Boolean(maintenanceWindowId);

	const { data: existingMaintenanceWindow } = useGet<MaintenanceWindow>(
		isEditMode ? `/maintenance-window/${maintenanceWindowId}` : null,
		{},
		{ keepPreviousData: false }
	);

	const { data: monitors } = useGet<Monitor[]>("/monitors/team");

	const { post, loading: isPosting } = usePost();
	const { patch, loading: isPatching } = usePatch();

	const { schema, defaults } = useMaintenanceWindowForm({
		data: existingMaintenanceWindow,
	});

	const form = useForm<MaintenanceWindowFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { handleSubmit, trigger } = form;
	useEffect(() => {
		if (existingMaintenanceWindow) {
			form.reset(defaults);
		}
	}, [existingMaintenanceWindow, defaults, form]);

	const buildPayload = (data: MaintenanceWindowFormData) => {
		const startDateTime = dayjs(data.startDate)
			.set("hour", parseInt(data.startTime.split(":")[0], 10))
			.set("minute", parseInt(data.startTime.split(":")[1], 10));

		const durationUnit = durationUnitOptions.find((o) => o.id === data.durationUnit);
		const durationInMs = data.duration * (durationUnit?.multiplier ?? 1000);
		const endDateTime = startDateTime.add(durationInMs, "milliseconds");

		const repeatOption = repeatOptions.find((o) => o.id === data.repeat);
		const repeat = repeatOption?.value ?? 0;

		const payload: Record<string, unknown> = {
			name: data.name,
			duration: data.duration,
			durationUnit: data.durationUnit,
			monitors: data.monitors,
			start: startDateTime.toISOString(),
			end: endDateTime.toISOString(),
			repeat,
		};

		return payload;
	};

	const onSubmit = async (data: MaintenanceWindowFormData) => {
		const payload = buildPayload(data);

		let result;
		if (isEditMode && maintenanceWindowId) {
			result = await patch(`/maintenance-window/${maintenanceWindowId}`, payload);
		} else {
			result = await post("/maintenance-window", payload);
		}

		if (result?.success) {
			await mutate(
				(key) => typeof key === "string" && key.startsWith("/maintenance-window")
			);
			navigate("/maintenance");
		}
	};

	const isLoading = isPosting || isPatching;

	const onError = (errors: any) => {
		logger.error("Maintenance form submission failed", undefined, { errors });
	};

	return (
		<FormProvider {...form}>
			<BasePage
				component={"form"}
				onSubmit={handleSubmit(onSubmit, onError)}
			>
				<ConfigBox
					title={t("pages.maintenanceWindow.form.general.title")}
					subtitle={t("pages.maintenanceWindow.form.general.description")}
					rightContent={
						<Stack spacing={theme.spacing(LAYOUT.MD)}>
							<FormTextField
								name="name"
								fieldLabel={t("pages.maintenanceWindow.form.general.option.name.label")}
								placeholder={t(
									"pages.maintenanceWindow.form.general.option.name.placeholder"
								)}
							/>
							<FormSelectField
								name="repeat"
								fieldLabel={t("pages.maintenanceWindow.form.general.option.repeat.label")}
								options={repeatOptions.map((option) => ({
									value: option.id,
									label: option.name,
								}))}
							/>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("pages.maintenanceWindow.form.startDate.title")}
					subtitle={t("pages.maintenanceWindow.form.startDate.description")}
					rightContent={
						<Stack spacing={theme.spacing(LAYOUT.MD)}>
							<FormDatePickerField
								name="startDate"
								fieldLabel={t(
									"pages.maintenanceWindow.form.startDate.option.startDate.label"
								)}
								onValueChange={() => trigger("startDate")}
							/>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("pages.maintenanceWindow.form.startTime.title")}
					subtitle={t("pages.maintenanceWindow.form.startTime.description")}
					rightContent={
						<Stack spacing={theme.spacing(LAYOUT.MD)}>
							<FormTimePickerField
								name="startTime"
								fieldLabel={t(
									"pages.maintenanceWindow.form.startTime.option.startTime.label"
								)}
								onValueChange={() => trigger("startDate")}
							/>
							<Stack
								direction="row"
								alignItems="flex-start"
								spacing={theme.spacing(LAYOUT.MD)}
							>
								<FormNumberField
									name="duration"
									fieldLabel={t(
										"pages.maintenanceWindow.form.startTime.option.duration.label"
									)}
									sx={{ width: 120 }}
								/>
								<FormSelectField
									name="durationUnit"
									fieldLabel={" "}
									options={durationUnitOptions.map((option) => ({
										value: option.id,
										label: option.name,
									}))}
								/>
							</Stack>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("pages.maintenanceWindow.form.startTime.monitors.title")}
					subtitle={t("pages.maintenanceWindow.form.startTime.monitors.description")}
					rightContent={
						<FormMultiSelectField
							name="monitors"
							fieldLabel={t(
								"pages.maintenanceWindow.form.startTime.monitors.option.addMonitors.label"
							)}
							options={monitors ?? []}
						/>
					}
				/>
				<Stack
					direction="row"
					justifyContent="flex-end"
					spacing={theme.spacing(SPACING.LG)}
				>
					<Button
						loading={isLoading}
						type="submit"
						variant="contained"
						color="primary"
					>
						{t("common.buttons.save")}
					</Button>
				</Stack>
			</BasePage>
		</FormProvider>
	);
};

export default CreateMaintenanceWindowPage;

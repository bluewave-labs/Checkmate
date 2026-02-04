import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import {
	TextField,
	Select,
	DatePicker,
	TimePicker,
	Button,
	Autocomplete,
} from "@/Components/v2/inputs";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";
import type { MaintenanceWindowFormData } from "@/Validation/maintenanceWindow";
import { repeatOptions, durationUnitOptions } from "@/Validation/maintenanceWindow";
import { useMaintenanceWindowForm } from "@/Hooks/useMaintenanceWindowForm";
import { useGet, usePost, usePatch } from "@/Hooks/UseApi";
import { useParams, useNavigate } from "react-router-dom";
import type { Monitor } from "@/Types/Monitor";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { Trash2 } from "lucide-react";

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

	const { control, handleSubmit, trigger } = form;
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

		if (repeat === 0) {
			payload.expiry = endDateTime.toISOString();
		}

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
			navigate("/maintenance");
		}
	};

	const isLoading = isPosting || isPatching;

	const onError = (errors: any) => {
		console.error("Form submission errors:", errors);
	};

	return (
		<BasePage
			component={"form"}
			onSubmit={handleSubmit(onSubmit, onError)}
		>
			<ConfigBox
				title={t("pages.maintenanceWindow.form.general.title")}
				subtitle={t("pages.maintenanceWindow.form.general.description")}
				rightContent={
					<Stack spacing={theme.spacing(8)}>
						<Controller
							name="name"
							control={control}
							defaultValue={defaults.name}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={t("pages.maintenanceWindow.form.general.option.name.label")}
									placeholder={t(
										"pages.maintenanceWindow.form.general.option.name.placeholder"
									)}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
						<Controller
							name="repeat"
							control={control}
							defaultValue={defaults.repeat}
							render={({ field, fieldState }) => (
								<Select
									value={field.value}
									fieldLabel={t(
										"pages.maintenanceWindow.form.general.option.repeat.label"
									)}
									error={!!fieldState.error}
									onChange={field.onChange}
								>
									{repeatOptions.map((option) => (
										<MenuItem
											key={option.id}
											value={option.id}
										>
											<Typography>{option.name}</Typography>
										</MenuItem>
									))}
								</Select>
							)}
						/>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.maintenanceWindow.form.startDate.title")}
				subtitle={t("pages.maintenanceWindow.form.startDate.description")}
				rightContent={
					<Stack spacing={theme.spacing(8)}>
						<Controller
							name="startDate"
							control={control}
							defaultValue={defaults.startDate}
							render={({ field, fieldState }) => (
								<DatePicker
									fieldLabel={t(
										"pages.maintenanceWindow.form.startDate.option.startDate.label"
									)}
									value={field.value ? dayjs(field.value, "YYYY-MM-DD") : null}
									onChange={(date) => {
										field.onChange(date ? date.format("YYYY-MM-DD") : "");
									}}
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.maintenanceWindow.form.startTime.title")}
				subtitle={t("pages.maintenanceWindow.form.startTime.description")}
				rightContent={
					<Stack spacing={theme.spacing(8)}>
						<Controller
							name="startTime"
							control={control}
							defaultValue={defaults.startTime}
							render={({ field }) => (
								<TimePicker
									fieldLabel={t(
										"pages.maintenanceWindow.form.startTime.option.startTime.label"
									)}
									value={field.value ? dayjs(field.value, "HH:mm") : null}
									onChange={(time) => {
										field.onChange(time ? time.format("HH:mm") : ""); trigger("startDate");
									}}
								/>
							)}
						/>
						<Stack
							direction="row"
							alignItems="flex-end"
							spacing={theme.spacing(4)}
						>
							<Controller
								name="duration"
								control={control}
								defaultValue={defaults.duration}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										type="number"
										fieldLabel={t(
											"pages.maintenanceWindow.form.startTime.option.duration.label"
										)}
										value={field.value === 0 ? "" : field.value}
										onChange={(e) => {
											const val = e.target.value;
											field.onChange(val === "" ? 0 : Number(val));
										}}
										error={!!fieldState.error}
										helperText={fieldState.error?.message ?? ""}
										sx={{ width: 120 }}
									/>
								)}
							/>
							<Controller
								name="durationUnit"
								control={control}
								defaultValue={defaults.durationUnit}
								render={({ field }) => (
									<Select
										value={field.value}
										onChange={field.onChange}
										sx={{ minWidth: 120 }}
									>
										{durationUnitOptions.map((option) => (
											<MenuItem
												key={option.id}
												value={option.id}
											>
												<Typography>{option.name}</Typography>
											</MenuItem>
										))}
									</Select>
								)}
							/>
						</Stack>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.maintenanceWindow.form.startTime.monitors.title")}
				subtitle={t("pages.maintenanceWindow.form.startTime.monitors.description")}
				rightContent={
					<Controller
						name="monitors"
						control={control}
						defaultValue={defaults.monitors}
						render={({ field, fieldState }) => {
							const monitorsList = monitors ?? [];
							const selectedMonitors = field.value
								.map((id: string) => monitorsList.find((m) => m.id === id))
								.filter((m): m is Monitor => m !== undefined);

							return (
								<Stack spacing={theme.spacing(4)}>
									<Autocomplete
										multiple
										options={monitorsList}
										getOptionLabel={(option: Monitor) => option.name}
										value={selectedMonitors}
										onChange={(_, newValue) => {
											field.onChange(newValue.map((m: Monitor) => m.id));
										}}
										fieldLabel={t(
											"pages.maintenanceWindow.form.startTime.monitors.option.addMonitors.label"
										)}
										renderInput={(params) => (
											<TextField
												{...params}
												placeholder={
													selectedMonitors.length === 0
														? t(
																"pages.maintenanceWindow.form.startTime.monitors.option.addMonitors.label"
															)
														: ""
												}
												error={!!fieldState.error}
												helperText={fieldState.error?.message}
											/>
										)}
									/>
									{selectedMonitors.length > 0 && (
										<Stack>
											{selectedMonitors.map((monitor) => (
												<Stack
													key={monitor.id}
													direction="row"
													alignItems="center"
													spacing={theme.spacing(4)}
													padding={theme.spacing(4)}
													marginTop={theme.spacing(2)}
													borderRadius={1}
													sx={{
														border: `1px solid ${theme.palette.divider}`,
													}}
												>
													<Typography flexGrow={1}>{monitor.name}</Typography>
													<IconButton
														size="small"
														onClick={() => {
															field.onChange(
																field.value.filter((id: string) => id !== monitor.id)
															);
														}}
														aria-label="Remove monitor"
													>
														<Trash2 size={16} />
													</IconButton>
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
			<Stack
				direction="row"
				justifyContent="flex-end"
				spacing={theme.spacing(2)}
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
	);
};

export default CreateMaintenanceWindowPage;

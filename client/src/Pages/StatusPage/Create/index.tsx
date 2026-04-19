import { BasePage, ConfigBox } from "@/Components/design-elements";
import Stack from "@mui/material/Stack";
import { logger } from "@/Utils/logger";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import {
	ImageUpload,
	SwitchComponent,
	Button,
	TextField,
	Autocomplete,
	Checkbox,
	Dialog,
	ColorInput,
} from "@/Components/inputs";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStatusPageForm } from "@/Hooks/useStatusPageForm";
import type { StatusPageFormData } from "@/Validation/statusPage";
import { useGet, usePost, usePut, useDelete } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPageType, StatusPageResponse } from "@/Types/StatusPage";
import { getMonitorTypeLabel } from "@/Types/StatusPage";
import timezones from "@/Utils/timezones.json";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { HeaderConfigStatusControls } from "./Components/HeaderConfigStatusControls";

const monitorsUrl = (() => {
	const params = new URLSearchParams();
	[
		"http",
		"ping",
		"port",
		"docker",
		"game",
		"grpc",
		"websocket",
		"hardware",
		"pagespeed",
	].forEach((type) => params.append("type", type));
	return `/monitors/team?${params.toString()}`;
})();

interface TimezoneOption {
	_id: string;
	name: string;
}

const CreateStatusPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { url } = useParams<{ url: string }>();

	const isCreate = typeof url === "undefined";

	// Fetch existing status page data when configuring
	const { data: statusPageData, isLoading: isLoadingStatusPage } =
		useGet<StatusPageResponse>(
			isCreate
				? null
				: `/status-page/${url}?type=uptime&type=infrastructure&type=pagespeed`
		);

	const { data: monitorsResponse } = useGet<Monitor[]>(monitorsUrl);
	const monitors = monitorsResponse ?? [];

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

	const { control, reset, handleSubmit } = form;

	// Reset form when defaults change (from fetched data)
	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	const watchedMonitorIds: string[] = form.watch("monitors") ?? [];
	const computedTypes: StatusPageType[] = useMemo(() => {
		const selectedMonitors = (watchedMonitorIds ?? [])
			.map((id) => monitors.find((m) => m.id === id))
			.filter((m): m is Monitor => m !== undefined);

		const typesSet = new Set<StatusPageType>();
		selectedMonitors.forEach((m) => {
			if (m.type === "hardware") typesSet.add("infrastructure");
			else if (m.type === "pagespeed") typesSet.add("pagespeed");
			else typesSet.add("uptime");
		});

		return typesSet.size ? Array.from(typesSet) : ["uptime"];
	}, [watchedMonitorIds, monitors]);

	useEffect(() => {
		form.setValue("type", computedTypes);
	}, [computedTypes]);

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
		if (data.timezone) fd.append("timezone", data.timezone);
		if (data.color) fd.append("color", data.color);
		fd.append("showCharts", String(data.showCharts));
		fd.append("showUptimePercentage", String(data.showUptimePercentage));
		fd.append("showAdminLoginLink", String(data.showAdminLoginLink));
		fd.append("showInfrastructure", String(data.showInfrastructure));
		fd.append("showPageSpeed", String(data.showPageSpeed));

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
			navigate(`/status/${data.url}`);
		}
	};

	if (!isCreate && isLoadingStatusPage) {
		return <BasePage>Loading...</BasePage>;
	}
	return (
		<BasePage
			component="form"
			onSubmit={handleSubmit(onSubmit, onError)}
		>
			{!isCreate && <HeaderConfigStatusControls onDelete={handleDeleteClick} />}
			<ConfigBox
				title={t("pages.statusPages.form.access.title")}
				subtitle={t("pages.statusPages.form.access.description")}
				rightContent={
					<Stack
						direction="row"
						alignItems="center"
						spacing={theme.spacing(SPACING.MD)}
					>
						<Controller
							name="isPublished"
							control={control}
							render={({ field }) => (
								<SwitchComponent
									checked={field.value ?? false}
									onChange={(e) => field.onChange(e.target.checked)}
								/>
							)}
						/>
						<Typography>
							{t("pages.statusPages.form.access.option.published.name")}
						</Typography>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.statusPages.form.basicInfo.title")}
				subtitle={t("pages.statusPages.form.basicInfo.description")}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Controller
							name="companyName"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									fieldLabel={t("pages.statusPages.form.basicInfo.option.name.label")}
									placeholder={t(
										"pages.statusPages.form.basicInfo.option.name.placeholder"
									)}
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
						<Controller
							name="url"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									fieldLabel={t("pages.statusPages.form.basicInfo.option.url.label")}
									placeholder={t(
										"pages.statusPages.form.basicInfo.option.url.placeholder"
									)}
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.statusPages.form.monitors.title")}
				subtitle={t("pages.statusPages.form.monitors.description")}
				rightContent={
					<Controller
						name="monitors"
						control={control}
						render={({ field, fieldState }) => {
							const selectedMonitors = field.value
								.map((id: string) => monitors.find((m) => m.id === id))
								.filter((m): m is Monitor => m !== undefined);

							const handleDragEnd = (result: DropResult) => {
								if (!result.destination) return;
								const reordered = Array.from(field.value);
								const [removed] = reordered.splice(result.source.index, 1);
								reordered.splice(result.destination.index, 0, removed);
								field.onChange(reordered);
							};

							return (
								<Stack spacing={theme.spacing(LAYOUT.MD)}>
									<Autocomplete
										multiple
										options={monitors}
										getOptionLabel={(option: Monitor) => option.name}
										value={selectedMonitors}
										onChange={(_, newValue) => {
											field.onChange(newValue.map((m: Monitor) => m.id));
										}}
										fieldLabel={t(
											"pages.statusPages.form.monitors.option.monitors.label"
										)}
										renderInput={(params) => (
											<TextField
												{...params}
												placeholder={
													selectedMonitors.length === 0
														? t(
																"pages.statusPages.form.monitors.option.monitors.placeholder"
															)
														: ""
												}
												error={!!fieldState.error}
												helperText={fieldState.error?.message}
											/>
										)}
									/>
									{selectedMonitors.length > 0 && (
										<DragDropContext onDragEnd={handleDragEnd}>
											<Droppable droppableId="monitors-list">
												{(provided) => (
													<Stack
														{...provided.droppableProps}
														ref={provided.innerRef}
													>
														{selectedMonitors.map((monitor, index) => (
															<Draggable
																key={monitor.id}
																draggableId={monitor.id}
																index={index}
															>
																{(provided) => (
																	<Stack
																		ref={provided.innerRef}
																		{...provided.draggableProps}
																		{...provided.dragHandleProps}
																		direction="row"
																		alignItems="center"
																		spacing={theme.spacing(LAYOUT.XS)}
																		padding={theme.spacing(LAYOUT.XS)}
																		marginTop={theme.spacing(SPACING.LG)}
																		borderRadius={1}
																		sx={{
																			border: `1px solid ${theme.palette.divider}`,
																			cursor: "grab",
																			"&:active": { cursor: "grabbing" },
																		}}
																	>
																		<GripVertical size={20} />
																		<Typography
																			flexGrow={1}
																		>{`${monitor.name} (${getMonitorTypeLabel(monitor.type, t)})`}</Typography>
																		<IconButton
																			size="small"
																			onClick={() => {
																				field.onChange(
																					field.value.filter(
																						(id: string) => id !== monitor.id
																					)
																				);
																			}}
																			aria-label="Remove monitor"
																		>
																			<Trash2 size={16} />
																		</IconButton>
																	</Stack>
																)}
															</Draggable>
														))}
														{provided.placeholder}
													</Stack>
												)}
											</Droppable>
										</DragDropContext>
									)}
								</Stack>
							);
						}}
					/>
				}
			/>
			<ConfigBox
				title={t("pages.statusPages.form.timezone.title")}
				subtitle={t("pages.statusPages.form.timezone.description")}
				rightContent={
					<Controller
						name="timezone"
						control={control}
						render={({ field }) => (
							<Autocomplete
								options={timezones}
								getOptionLabel={(option: TimezoneOption) => option.name}
								value={
									timezones.find((tz: TimezoneOption) => tz._id === field.value) ?? null
								}
								onChange={(_, newValue: TimezoneOption | null) => {
									field.onChange(newValue?._id ?? "");
								}}
								fieldLabel={t("pages.statusPages.form.timezone.option.timezone.label")}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder={t(
											"pages.statusPages.form.timezone.option.timezone.placeholder"
										)}
									/>
								)}
							/>
						)}
					/>
				}
			/>
			<ConfigBox
				title={t("pages.statusPages.form.appearance.title")}
				subtitle={t("pages.statusPages.form.appearance.description")}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Stack alignItems={"center"}>
							<Controller
								name="logo"
								control={control}
								render={({ field }) => (
									<ImageUpload
										src={field.value?.data}
										onChange={(file) => {
											if (file) {
												field.onChange({
													data: file.src,
													contentType: file.file.type,
												});
											} else {
												field.onChange(null);
											}
										}}
									/>
								)}
							/>
						</Stack>
						<Controller
							name="color"
							control={control}
							render={({ field }) => (
								<ColorInput
									format="hex"
									value={field.value}
									onChange={field.onChange}
									fieldLabel={t("pages.statusPages.form.appearance.option.color.label")}
								/>
							)}
						/>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.statusPages.form.features.title")}
				subtitle={t("pages.statusPages.form.features.description")}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Controller
							name="showCharts"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Checkbox
											checked={field.value}
											onChange={field.onChange}
										/>
									}
									label={t("pages.statusPages.form.features.option.showCharts.label")}
								/>
							)}
						/>
						<Controller
							name="showInfrastructure"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Checkbox
											checked={field.value}
											onChange={field.onChange}
										/>
									}
									label={t(
										"pages.statusPages.form.features.option.showInfrastructure.label"
									)}
								/>
							)}
						/>
						<Controller
							name="showPageSpeed"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Checkbox
											checked={field.value}
											onChange={field.onChange}
										/>
									}
									label={t("pages.statusPages.form.features.option.showPageSpeed.label")}
								/>
							)}
						/>
						{/* <Controller
							name="showUptimePercentage"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Checkbox
											checked={field.value}
											onChange={field.onChange}
										/>
									}
									label={t(
										"pages.statusPages.form.features.option.showUptimePercentage.label"
									)}
								/>
							)}
						/>
						<Controller
							name="showAdminLoginLink"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Checkbox
											checked={field.value}
											onChange={field.onChange}
										/>
									}
									label={t(
										"pages.statusPages.form.features.option.showAdminLoginLink.label"
									)}
								/>
							)}
						/> */}
					</Stack>
				}
			/>
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

export default CreateStatusPage;

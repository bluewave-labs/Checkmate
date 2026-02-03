import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import Stack from "@mui/material/Stack";
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
} from "@/Components/v2/inputs";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStatusPageForm } from "@/Hooks/useStatusPageForm";
import type { StatusPageFormData } from "@/Validation/statusPage";
import { useGet, usePost, usePut } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPageResponse } from "@/Types/StatusPage";
import timezones from "@/Utils/timezones.json";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MuiColorInput } from "mui-color-input";

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
		useGet<StatusPageResponse>(isCreate ? null : `/status-page/${url}?type=uptime`);

	const { data: monitorsResponse } = useGet<Monitor[]>(
		"/monitors/team?type=http&type=ping&type=port&type=docker"
	);
	const monitors = monitorsResponse ?? [];

	const { post, loading: isSubmittingPost } = usePost();
	const { put, loading: isSubmittingPut } = usePut();
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

	const onError = (errors: any) => {
		console.log(errors);
	};

	const onSubmit = async (data: StatusPageFormData) => {
		const fd = new FormData();
		fd.append("type", "uptime");
		fd.append("isPublished", String(data.isPublished));
		if (data.companyName) fd.append("companyName", data.companyName);
		if (data.url) fd.append("url", data.url);
		if (data.timezone) fd.append("timezone", data.timezone);
		if (data.color) fd.append("color", data.color);
		fd.append("showCharts", String(data.showCharts));
		fd.append("showUptimePercentage", String(data.showUptimePercentage));
		fd.append("showAdminLoginLink", String(data.showAdminLoginLink));

		data.monitors.forEach((monitorId) => {
			fd.append("monitors[]", monitorId);
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
					console.error("Error fetching logo blob:", e);
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
			navigate(`/status/uptime/${data.url}`);
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
			<ConfigBox
				title={t("pages.statusPages.form.access.title")}
				subtitle={t("pages.statusPages.form.access.description")}
				rightContent={
					<Stack
						direction="row"
						alignItems="center"
						spacing={theme.spacing(2)}
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
					<Stack spacing={theme.spacing(6)}>
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
								<Stack spacing={theme.spacing(4)}>
									<Autocomplete
										multiple
										options={monitors}
										getOptionLabel={(option: Monitor) => option.name}
										value={selectedMonitors}
										onChange={(_, newValue) => {
											field.onChange(newValue.map((m: Monitor) => m.id));
										}}
										renderTags={() => null}
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
																		spacing={theme.spacing(4)}
																		padding={theme.spacing(4)}
																		marginTop={theme.spacing(2)}
																		borderRadius={1}
																		sx={{
																			border: `1px solid ${theme.palette.divider}`,
																			cursor: "grab",
																			"&:active": { cursor: "grabbing" },
																		}}
																	>
																		<GripVertical size={20} />
																		<Typography flexGrow={1}>{monitor.name}</Typography>
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
					<Stack spacing={theme.spacing(8)}>
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
								<MuiColorInput
									format="hex"
									value={field.value}
									onChange={field.onChange}
									label={t("pages.statusPages.form.appearance.option.color.label")}
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
					<Stack spacing={theme.spacing(2)}>
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
						/>
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
		</BasePage>
	);
};

export default CreateStatusPage;

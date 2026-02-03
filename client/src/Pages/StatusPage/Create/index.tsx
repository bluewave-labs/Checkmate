import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import {
	ImageUpload,
	SwitchComponent,
	Button,
	TextField,
	Autocomplete,
} from "@/Components/v2/inputs";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStatusPageForm } from "@/Hooks/useStatusPageForm";
import type { StatusPageFormData } from "@/Validation/statusPage";
import { useGet, usePost } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import timezones from "@/Utils/timezones.json";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface TimezoneOption {
	_id: string;
	name: string;
}

const CreateStatusPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { schema, defaults } = useStatusPageForm();
	const { post, loading: isSubmitting } = usePost();

	const { data: monitorsResponse } = useGet<Monitor[]>(
		"/monitors/team?type=http&type=ping&type=port&type=docker"
	);
	const monitors = monitorsResponse ?? [];

	const form = useForm<StatusPageFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { control, reset, handleSubmit } = form;

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

		data.monitors.forEach((monitorId) => {
			fd.append("monitors[]", monitorId);
		});

		if (data.logo?.data && data.logo.data !== "") {
			try {
				const imageResult = await axios.get(data.logo.data, {
					responseType: "blob",
				});
				fd.append("logo", imageResult.data);
				if (data.logo.data.startsWith("blob:")) {
					URL.revokeObjectURL(data.logo.data);
				}
			} catch (e) {
				console.error("Error fetching logo blob:", e);
			}
		}

		const result = await post("/status-page", fd, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		if (result) {
			navigate(`/status/uptime/${data.url}`);
		}
	};

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
					<Stack spacing={theme.spacing(8)}>
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
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
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
				title={t("pages.statusPages.form.monitors.title")}
				subtitle={t("pages.statusPages.form.monitors.description")}
				rightContent={
					<Controller
						name="monitors"
						control={control}
						render={({ field, fieldState }) => {
							const selectedMonitors = field.value
								.map((id: string) => monitors.find((m) => m.id === id))
								.filter(Boolean) as Monitor[];

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
										onChange={(_, newValue: Monitor[]) => {
											field.onChange(newValue.map((m) => m.id));
										}}
										fieldLabel={t(
											"pages.statusPages.form.monitors.option.monitors.label"
										)}
										renderInput={(params) => (
											<TextField
												{...params}
												placeholder={t(
													"pages.statusPages.form.monitors.option.monitors.placeholder"
												)}
												error={!!fieldState.error}
												helperText={fieldState.error?.message ?? ""}
											/>
										)}
										renderTags={() => null}
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

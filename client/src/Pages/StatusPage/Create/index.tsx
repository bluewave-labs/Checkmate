import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { Trash2 } from "lucide-react";
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
import { useGet } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import timezones from "@/Utils/timezones.json";

interface TimezoneOption {
	_id: string;
	name: string;
}

const CreateStatusPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { schema, defaults } = useStatusPageForm();

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

	const onSubmit = (data: StatusPageFormData) => {
		console.log("Form Data Submitted: ", data);
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
						render={({ field }) => {
							const selectedMonitors = monitors.filter((m) => field.value.includes(m.id));
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
										isOptionEqualToValue={(option, value) => option.id === value.id}
										fieldLabel={t(
											"pages.statusPages.form.monitors.option.monitors.label"
										)}
										renderInput={(params) => (
											<TextField
												{...params}
												placeholder={t(
													"pages.statusPages.form.monitors.option.monitors.placeholder"
												)}
											/>
										)}
									/>
									{selectedMonitors.length > 0 && (
										<Stack
											flex={1}
											width="100%"
										>
											{selectedMonitors.map((monitor, index) => (
												<Stack
													direction="row"
													alignItems="center"
													key={monitor.id}
													width="100%"
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
													{index < selectedMonitors.length - 1 && <Divider />}
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
					// loading={isSubmitting}
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

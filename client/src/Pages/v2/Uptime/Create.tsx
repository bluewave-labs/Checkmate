import Stack from "@mui/material/Stack";
import { TextInput } from "@/Components/v2/Inputs/TextInput";
import { AutoCompleteInput } from "@/Components/v2/Inputs/AutoComplete";
import { ConfigBox, BasePage } from "@/Components/v2/DesignElements";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import { RadioWithDescription } from "@/Components/v2/Inputs/RadioInput";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Typography } from "@mui/material";
import humanInterval from "human-interval";

import { useTranslation } from "react-i18next";
import { useForm, Controller, useWatch } from "react-hook-form";
import { int, z } from "zod";
import { monitorSchema } from "@/Validation/v2/zod";
import { useTheme } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGet, usePost } from "@/Hooks/v2/UseApi";
import type { ApiResponse } from "@/Hooks/v2/UseApi";

const CreateUptimePage = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	type FormValues = z.infer<typeof monitorSchema>;
	type SubmitValues = Omit<FormValues, "interval"> & { interval: number | undefined };

	const {
		handleSubmit,
		control,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(monitorSchema) as any,
		defaultValues: {
			type: "http",
			url: "",
			n: 3,
			notificationChannels: [],
			name: "",
			interval: "1 minute",
		},
		mode: "onChange",
	});
	const { response } = useGet<ApiResponse>("/notification-channels");
	const { post, loading, error } = usePost<SubmitValues, ApiResponse>("/monitors");
	const selectedType = useWatch({
		control,
		name: "type",
	});
	const notificationChannels = useWatch({
		control,
		name: "notificationChannels",
	});

	const onSubmit = async (data: FormValues) => {
		let interval = humanInterval(data.interval);
		if (!interval) interval = 60000;
		const submitData = { ...data, interval };
		const result = await post(submitData);
		if (result) {
			console.log(result);
		} else {
			console.error(error);
		}
	};

	const notificationOptions = response?.data ?? [];
	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<BasePage>
				<ConfigBox
					title={t("distributedUptimeCreateChecks")}
					subtitle={t("distributedUptimeCreateChecksDescription")}
					rightContent={
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<FormControl error={!!errors.type}>
									<RadioGroup
										{...field}
										sx={{ gap: theme.spacing(6) }}
									>
										<RadioWithDescription
											value="http"
											label={"HTTP"}
											description={"Use HTTP to monitor your website or API endpoint."}
										/>
										<RadioWithDescription
											value="https"
											label="HTTPS"
											description="Use HTTPS to monitor your website or API endpoint.
"
										/>
										<RadioWithDescription
											value="ping"
											label={t("pingMonitoring")}
											description={t("pingMonitoringDescription")}
										/>
									</RadioGroup>
								</FormControl>
							)}
						/>
					}
				/>
				<ConfigBox
					title={t("settingsGeneralSettings")}
					subtitle={t(`uptimeGeneralInstructions.${selectedType}`)}
					rightContent={
						<Stack gap={theme.spacing(8)}>
							<Controller
								name="url"
								control={control}
								render={({ field }) => (
									<TextInput
										{...field}
										type="text"
										label={t("url")}
										fullWidth
										error={!!errors.url}
										helperText={errors.url ? errors.url.message : ""}
									/>
								)}
							/>
							<Controller
								name="name"
								control={control}
								render={({ field }) => (
									<TextInput
										{...field}
										type="text"
										label={t("displayName")}
										fullWidth
										error={!!errors.name}
										helperText={errors.name ? errors.name.message : ""}
									/>
								)}
							/>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("createMonitorPage.incidentConfigTitle")}
					subtitle={t("createMonitorPage.incidentConfigDescriptionV2")}
					rightContent={
						<Controller
							name="n"
							control={control}
							render={({ field }) => (
								<TextInput
									{...field}
									type="number"
									label={t("createMonitorPage.incidentConfigStatusCheckNumber")}
									fullWidth
									error={!!errors.n}
									helperText={errors.n ? errors.n.message : ""}
									onChange={(e) => {
										const target = e.target as HTMLInputElement;
										field.onChange(target.valueAsNumber);
									}}
								/>
							)}
						/>
					}
				/>
				<ConfigBox
					title={t("notificationConfig.title")}
					subtitle={t("notificationConfig.description")}
					rightContent={
						<Stack>
							<Controller
								name="notificationChannels"
								control={control}
								defaultValue={[]} // important!
								render={({ field }) => (
									<AutoCompleteInput
										multiple
										options={notificationOptions}
										getOptionLabel={(option) => option.name}
										value={notificationOptions.filter((o: any) =>
											(field.value || []).includes(o._id)
										)}
										onChange={(_, newValue) => {
											field.onChange(newValue.map((o: any) => o._id));
										}}
									/>
								)}
							/>
							<Stack
								gap={theme.spacing(2)}
								mt={theme.spacing(2)}
							>
								{notificationChannels.map((notificationId) => {
									const option = notificationOptions.find(
										(o: any) => o._id === notificationId
									);
									if (!option) return null;
									return (
										<Stack
											width={"100%"}
											justifyContent={"space-between"}
											direction="row"
											key={notificationId}
										>
											<Typography>{option.name}</Typography>
											<DeleteOutlineRoundedIcon
												onClick={() => {
													const updated = notificationChannels.filter(
														(id) => id !== notificationId
													);
													setValue("notificationChannels", updated);
												}}
												sx={{ cursor: "pointer" }}
											/>
										</Stack>
									);
								})}
							</Stack>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("createMonitorPage.intervalTitle")}
					subtitle="How often to check the URL"
					rightContent={
						<Controller
							name="interval"
							control={control}
							render={({ field }) => (
								<TextInput
									{...field}
									type="text"
									label={t("createMonitorPage.intervalDescription")}
									fullWidth
									error={!!errors.interval}
									helperText={errors.interval ? errors.interval.message : ""}
								/>
							)}
						/>
					}
				/>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						loading={loading}
						type="submit"
						variant="contained"
						color="accent"
					>
						{t("settingsSave")}
					</Button>
				</Stack>
			</BasePage>
		</form>
	);
};

export default CreateUptimePage;

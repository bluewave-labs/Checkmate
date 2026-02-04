import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import { TextField, Select, DatePicker } from "@/Components/v2/inputs";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";
import type { MaintenanceWindowFormData } from "@/Validation/maintenanceWindow";
import { repeatOptions } from "@/Validation/maintenanceWindow";
import { useMaintenanceWindowForm } from "@/Hooks/useMaintenanceWindowForm";
import { useGet } from "@/Hooks/UseApi";
import { useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";

const CreateMaintenanceWindowPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { maintenanceWindowId } = useParams<{ maintenanceWindowId: string }>();
	const isEditMode = Boolean(maintenanceWindowId);

	const { data: existingMaintenanceWindow } = useGet<MaintenanceWindow>(
		isEditMode ? `/maintenance-window/${maintenanceWindowId}` : null
	);

	const { schema, defaults } = useMaintenanceWindowForm({
		data: existingMaintenanceWindow,
	});

	const form = useForm<MaintenanceWindowFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { control } = form;

	return (
		<BasePage>
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
							render={({ field }) => (
								<DatePicker
									fieldLabel={t(
										"pages.maintenanceWindow.form.startDate.option.startDate.label"
									)}
									value={field.value ? dayjs(field.value, "YYYY-MM-DD") : null}
									onChange={(date) => {
										field.onChange(date ? date.format("YYYY-MM-DD") : "");
									}}
								/>
							)}
						/>
					</Stack>
				}
			/>
		</BasePage>
	);
};

export default CreateMaintenanceWindowPage;

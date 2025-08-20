import { Box, Button, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import ConfigBox from "../../../Components/ConfigBox";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { maintenanceWindowValidation } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import MonitorList from "./Components/MonitorList";
import ConfigSelect from "./Components/ConfigSelect";
import useMaintenanceData from "./hooks/useMaintenanceData";
import useMaintenanceActions from "./hooks/useMaintenanceActions";

import TextInput from "../../../Components/Inputs/TextInput";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import CalendarIcon from "../../../assets/icons/calendar.svg?react";
import "./index.css";
import Search from "../../../Components/Inputs/Search";
import { logger } from "../../../Utils/Logger";

import { useNavigate, useParams } from "react-router-dom";
import { buildErrors, hasValidationErrors } from "../../../Validation/error";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const repeatConfig = [
	{ _id: 0, name: "Don't repeat", value: "none" },
	{
		_id: 1,
		name: "Repeat daily",
		value: "daily",
	},
	{ _id: 2, name: "Repeat weekly", value: "weekly" },
];

const durationConfig = [
	{ _id: 0, name: "seconds" },
	{ _id: 1, name: "minutes" },
	{ _id: 2, name: "hours" },
	{
		_id: 3,
		name: "days",
	},
];

const CreateMaintenance = () => {
	const { maintenanceWindowId } = useParams();
	const { handleSubmitForm } = useMaintenanceActions();
	const { fetchMonitorsMaintenance, initializeMaintenanceForEdit } = useMaintenanceData();
	const navigate = useNavigate();
	const theme = useTheme();
	const { t } = useTranslation();
	const { user } = useSelector((state) => state.auth);
	const [monitors, setMonitors] = useState([]);
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [form, setForm] = useState({
		repeat: "none",
		startDate: dayjs(),
		startTime: dayjs(),
		duration: "",
		durationUnit: "seconds",
		name: "",
		monitors: [],
	});
	const handleFormChange = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		const { error } = maintenanceWindowValidation.validate(
			{ [key]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => {
			return buildErrors(prev, key, error);
		});
	};

	useEffect(() => {
		const fetchMonitors = async () => {
			setIsLoading(true);
			try {
				const fetchedMonitors = await fetchMonitorsMaintenance();
				setMonitors(fetchedMonitors);

				if (maintenanceWindowId === undefined) {
					return;
				}
				const maintenanceWindowInformation = await initializeMaintenanceForEdit(
					maintenanceWindowId,
					fetchedMonitors
				);
				setForm((prev) => ({
					...prev,
					...maintenanceWindowInformation,
				}));
			} catch (error) {
				createToast({ body: "Failed to fetch data" });
				logger.error("Failed to fetch monitors", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [user]);

	const handleSubmit = async () => {
		if (hasValidationErrors(form, maintenanceWindowValidation, setErrors)) return;
		const request = handleSubmitForm(maintenanceWindowId, form);
		try {
			setIsLoading(true);
			await request;
			createToast({
				body: "Successfully created maintenance window",
			});
			navigate("/maintenance");
		} catch (error) {
			createToast({
				body: `Failed to ${
					maintenanceWindowId === undefined ? "create" : "edit"
				} maintenance window`,
			});
			logger.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box className="create-maintenance">
			<Breadcrumbs
				list={[
					{ name: "maintenance", path: "/maintenance" },
					{
						name: maintenanceWindowId === undefined ? "create" : "edit",
						path: `/maintenance/create`,
					},
				]}
			/>
			<Stack
				component="form"
				noValidate
				spellCheck="false"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
			>
				<Box>
					<Typography
						component="h1"
						variant="h1"
					>
						<Typography
							component="span"
							fontSize="inherit"
						>
							{`${maintenanceWindowId === undefined ? t("createA") : t("edit")}`}{" "}
						</Typography>
						<Typography
							component="span"
							variant="h2"
							fontSize="inherit"
							fontWeight="inherit"
						>
							{t("maintenance")}{" "}
						</Typography>
						<Typography
							component="span"
							fontSize="inherit"
						>
							{t("window")}
						</Typography>
					</Typography>
					<Typography
						component="h2"
						variant="body2"
						fontSize={14}
					>
						{t("maintenanceWindowDescription")}
					</Typography>
				</Box>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							id="name"
							label={t("friendlyNameInput")}
							placeholder={t("friendlyNamePlaceholder")}
							value={form.name}
							onChange={(event) => {
								handleFormChange("name", event.target.value);
							}}
							error={errors["name"] ? true : false}
							helperText={errors["name"]}
						/>
						<ConfigSelect
							id="repeat"
							name="maintenance-repeat"
							label={t("maintenanceRepeat")}
							valueSelect={form.repeat}
							configSelection={repeatConfig}
							onChange={(value) => handleFormChange("repeat", value)}
						/>
						<Stack>
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DatePicker
									id="startDate"
									disablePast
									disableHighlightToday
									value={form.startDate}
									slots={{ openPickerIcon: () => <CalendarIcon /> }}
									slotProps={{
										switchViewButton: { sx: { display: "none" } },
										nextIconButton: { sx: { ml: theme.spacing(2) } },
										field: {
											sx: {
												width: "fit-content",
												"& > .MuiOutlinedInput-root": {
													flexDirection: "row-reverse",
												},
												"& input": {
													minHeight: 34,
													p: 0,
													pr: theme.spacing(5),
												},
												"& fieldset": {
													borderColor: theme.palette.primary.lowContrast,
													borderRadius: theme.shape.borderRadius,
												},
												"&:not(:has(.Mui-disabled)):not(:has(.Mui-error)) .MuiOutlinedInput-root:not(:has(input:focus)):hover fieldset":
													{
														borderColor: theme.palette.primary.lowContrast,
													},
											},
										},
										inputAdornment: { sx: { ml: 0, px: 3 } },
										openPickerButton: {
											sx: {
												py: 0,
												mr: 0,
												"& path": {
													stroke: theme.palette.primary.contrastTextTertiary,
													strokeWidth: 1.1,
												},
												"&:hover": { backgroundColor: "transparent" },
											},
										},
										// CAIO_REVIEW, entire popper
										popper: {
											sx: {
												"& .MuiPickersDay-root": {
													color: theme.palette.primary.contrastText,
													"&.Mui-selected": {
														backgroundColor: theme.palette.accent.main, // Selected day background
														color: theme.palette.primary.contrastText, // Selected day text color
													},
													"&:hover": {
														backgroundColor: theme.palette.accent.light, // Hover background
													},
													"&.Mui-disabled": {
														color: theme.palette.secondary.main, // Disabled day color
													},
												},
												"& .MuiDayCalendar-weekDayLabel": {
													color: theme.palette.primary.contrastText,
												},
												"& .MuiPickersCalendarHeader-label": {
													color: theme.palette.primary.contrastText,
												},
											},
										},
									}}
									sx={{}}
									onChange={(newDate) => {
										handleFormChange("startDate", newDate);
									}}
									error={errors["startDate"]}
								/>
							</LocalizationProvider>
						</Stack>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("startTime")}
						</Typography>
						<Typography> {t("timeZoneInfo")} </Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<MobileTimePicker
								id="startTime"
								label={t("startTime")}
								value={form.startTime}
								onChange={(newTime) => {
									handleFormChange("startTime", newTime);
								}}
								slotProps={{
									nextIconButton: { sx: { ml: theme.spacing(2) } },
									field: {
										sx: {
											width: "fit-content",
											"& > .MuiOutlinedInput-root": {
												flexDirection: "row-reverse",
											},
											"& input": {
												minHeight: 34,
												p: 0,
												pl: theme.spacing(5),
											},
											"& fieldset": {
												borderColor: theme.palette.primary.lowContrast,
												borderRadius: theme.shape.borderRadius,
											},
											"&:not(:has(.Mui-disabled)):not(:has(.Mui-error)) .MuiOutlinedInput-root:not(:has(input:focus)):hover fieldset":
												{
													borderColor: theme.palette.primary.lowContrast,
												},
										},
									},
								}}
								error={errors["startTime"]}
							/>
						</LocalizationProvider>

						<Stack
							direction="row"
							alignItems="end"
							spacing={theme.spacing(8)}
						>
							<TextInput
								type="number"
								id="duration"
								label={t("duration")}
								value={form.duration}
								onChange={(event) => {
									handleFormChange("duration", event.target.value);
								}}
								error={errors["duration"] ? true : false}
								helperText={errors["duration"]}
							/>
							<ConfigSelect
								id="durationUnit"
								valueSelect={form.durationUnit}
								configSelection={durationConfig}
								onChange={(value) => handleFormChange("durationUnit", value)}
								error={errors["durationUnit"]}
							/>
						</Stack>
					</Stack>
				</ConfigBox>

				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("monitorsToApply")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<Search
							id={"monitors"}
							label={t("addMonitors")}
							multiple={true}
							isAdorned={true}
							options={monitors}
							filteredBy="name"
							secondaryLabel={"type"}
							inputValue={search}
							value={form.monitors}
							handleInputChange={setSearch}
							handleChange={(selected) => {
								handleFormChange("monitors", selected);
							}}
							error={errors["monitors"]}
						/>
						<MonitorList
							selectedMonitors={form.monitors}
							setSelectedMonitors={(monitors) =>
								setForm((prev) => ({ ...prev, monitors }))
							}
						/>
					</Stack>
				</ConfigBox>

				<Box
					ml="auto"
					display="inline-block"
				>
					<Button
						variant="contained"
						color="secondary"
						onClick={() => navigate("/maintenance")}
						sx={{ mr: theme.spacing(6) }}
					>
						{t("cancel")}
					</Button>
					<Button
						loading={isLoading}
						variant="contained"
						color="accent"
						onClick={handleSubmit}
						disabled={false}
					>
						{`${
							maintenanceWindowId === undefined
								? t("createMaintenance")
								: t("editMaintenance")
						}`}
					</Button>
				</Box>
			</Stack>
		</Box>
	);
};

export default CreateMaintenance;

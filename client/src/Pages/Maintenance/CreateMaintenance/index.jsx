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

import dayjs from "dayjs";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import CalendarIcon from "../../../assets/icons/calendar.svg?react";
import "./index.css";
import Search from "../../../Components/Inputs/Search";
import { networkService } from "../../../main";
import { logger } from "../../../Utils/Logger";
import {
	MS_PER_SECOND,
	MS_PER_MINUTE,
	MS_PER_HOUR,
	MS_PER_DAY,
	MS_PER_WEEK,
} from "../../../Utils/timeUtils";
import { useNavigate, useParams } from "react-router-dom";
import { buildErrors, hasValidationErrors } from "../../../Validation/error";
import { useTranslation } from "react-i18next";

const getDurationAndUnit = (durationInMs) => {
	if (durationInMs % MS_PER_DAY === 0) {
		return {
			duration: (durationInMs / MS_PER_DAY).toString(),
			durationUnit: "days",
		};
	} else if (durationInMs % MS_PER_HOUR === 0) {
		return {
			duration: (durationInMs / MS_PER_HOUR).toString(),
			durationUnit: "hours",
		};
	} else if (durationInMs % MS_PER_MINUTE === 0) {
		return {
			duration: (durationInMs / MS_PER_MINUTE).toString(),
			durationUnit: "minutes",
		};
	} else {
		return {
			duration: (durationInMs / MS_PER_SECOND).toString(),
			durationUnit: "seconds",
		};
	}
};

const MS_LOOKUP = {
	seconds: MS_PER_SECOND,
	minutes: MS_PER_MINUTE,
	hours: MS_PER_HOUR,
	days: MS_PER_DAY,
	weeks: MS_PER_WEEK,
};

const REPEAT_LOOKUP = {
	none: 0,
	daily: MS_PER_DAY,
	weekly: MS_PER_DAY * 7,
};

const REVERSE_REPEAT_LOOKUP = {
	0: "none",
	[MS_PER_DAY]: "daily",
	[MS_PER_WEEK]: "weekly",
};

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

const getValueById = (config, id) => {
	const item = config.find((config) => config._id === id);
	return item ? (item.value ? item.value : item.name) : null;
};

const getIdByValue = (config, name) => {
	const item = config.find((config) => {
		if (config.value) {
			return config.value === name;
		} else {
			return config.name === name;
		}
	});
	return item ? item._id : null;
};

const CreateMaintenance = () => {
	const { maintenanceWindowId } = useParams();
	const navigate = useNavigate();
	const theme = useTheme();
	const { t } = useTranslation();
	const { user } = useSelector((state) => state.auth);
	const [monitors, setMonitors] = useState([]);
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [form, setForm] = useState({
		repeat: "none",
		startDate: dayjs(),
		startTime: dayjs(),
		duration: "",
		durationUnit: "seconds",
		name: "",
		monitors: [],
	});
	const [errors, setErrors] = useState({});

	useEffect(() => {
		const fetchMonitors = async () => {
			setIsLoading(true);
			try {
				const response = await networkService.getMonitorsByTeamId({
					limit: null,
					types: ["http", "ping", "pagespeed", "port"],
				});
				const monitors = response.data.data.monitors;
				setMonitors(monitors);

				if (maintenanceWindowId === undefined) {
					return;
				}

				const res = await networkService.getMaintenanceWindowById({
					maintenanceWindowId: maintenanceWindowId,
				});
				const maintenanceWindow = res.data.data;
				const { name, start, end, repeat, monitorId } = maintenanceWindow;
				const startTime = dayjs(start);
				const endTime = dayjs(end);
				const durationInMs = endTime.diff(startTime, "milliseconds").toString();
				const { duration, durationUnit } = getDurationAndUnit(durationInMs);
				const monitor = monitors.find((monitor) => monitor._id === monitorId);
				setForm({
					...form,
					name,
					repeat: REVERSE_REPEAT_LOOKUP[repeat],
					startDate: startTime,
					startTime,
					duration,
					durationUnit,
					monitors: monitor ? [monitor] : [],
				});
			} catch (error) {
				createToast({ body: "Failed to fetch data" });
				logger.error("Failed to fetch monitors", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [user]);

	const handleSearch = (value) => {
		setSearch(value);
	};

	const handleSelectMonitors = (monitors) => {
		setForm({ ...form, monitors });
		const { error } = maintenanceWindowValidation.validate(
			{ monitors },
			{ abortEarly: false }
		);
		setErrors((prev) => {
			return buildErrors(prev, "monitors", error);
		});
	};

	const handleFormChange = (key, value) => {
		setForm({ ...form, [key]: value });
		const { error } = maintenanceWindowValidation.validate(
			{ [key]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => {
			return buildErrors(prev, key, error);
		});
	};

	const handleTimeChange = (key, newTime) => {
		setForm({ ...form, [key]: newTime });
		const { error } = maintenanceWindowValidation.validate(
			{ [key]: newTime },
			{ abortEarly: false }
		);
		setErrors((prev) => {
			return buildErrors(prev, key, error);
		});
	};

	const handleSubmit = async () => {
		if (hasValidationErrors(form, maintenanceWindowValidation, setErrors)) return;
		// Build timestamp for maintenance window from startDate and startTime
		const start = dayjs(form.startDate)
			.set("hour", form.startTime.hour())
			.set("minute", form.startTime.minute());
		// Build end timestamp for maintenance window
		const MS_MULTIPLIER = MS_LOOKUP[form.durationUnit];
		const durationInMs = form.duration * MS_MULTIPLIER;
		const end = start.add(durationInMs);

		// Get repeat value in milliseconds
		const repeat = REPEAT_LOOKUP[form.repeat];

		const submit = {
			monitors: form.monitors.map((monitor) => monitor._id),
			name: form.name,
			start: start.toISOString(),
			end: end.toISOString(),
			repeat,
		};

		if (repeat === 0) {
			submit.expiry = end;
		}

		const requestConfig = { maintenanceWindow: submit };

		if (maintenanceWindowId !== undefined) {
			requestConfig.maintenanceWindowId = maintenanceWindowId;
		}
		const request =
			maintenanceWindowId === undefined
				? networkService.createMaintenanceWindow(requestConfig)
				: networkService.editMaintenanceWindow(requestConfig);

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
						<Select
							id="repeat"
							name="maintenance-repeat"
							label={t("maintenanceRepeat")}
							value={getIdByValue(repeatConfig, form.repeat)}
							onChange={(event) => {
								handleFormChange(
									"repeat",
									getValueById(repeatConfig, event.target.value)
								);
							}}
							items={repeatConfig}
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
										handleTimeChange("startDate", newDate);
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
						<Typography>{t("timeZoneInfo")}</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<MobileTimePicker
								id="startTime"
								label={t("startTime")}
								value={form.startTime}
								onChange={(newTime) => {
									handleTimeChange("startTime", newTime);
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
							<Select
								id="durationUnit"
								value={getIdByValue(durationConfig, form.durationUnit)}
								items={durationConfig}
								onChange={(event) => {
									handleFormChange(
										"durationUnit",
										getValueById(durationConfig, event.target.value)
									);
								}}
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
							isAdorned={false}
							options={monitors ? monitors : []}
							filteredBy="name"
							secondaryLabel={"type"}
							inputValue={search}
							value={form.monitors}
							handleInputChange={handleSearch}
							handleChange={handleSelectMonitors}
							error={errors["monitors"]}
							disabled={maintenanceWindowId !== undefined}
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

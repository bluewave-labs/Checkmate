// Components
import { Box, Stack, Tooltip, Typography, Button, ButtonGroup } from "@mui/material";
import ConfigBox from "../../../Components/ConfigBox";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import PulseDot from "../../../Components/Animated/PulseDot";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import SkeletonLayout from "./skeleton";
import NotificationsConfig from "../../../Components/NotificationConfig";
import Dialog from "../../../Components/Dialog";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import Radio from "../../../Components/Inputs/Radio";

// Utils
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { monitorValidation } from "../../../Validation/validation";
import { parseDomainName } from "../../../Utils/monitorUtils";
import { useTranslation } from "react-i18next";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useTheme } from "@emotion/react";
import { createToast } from "../../../Utils/toastUtils";

import { useParams } from "react-router";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";
import {
	useCreateMonitor,
	useFetchMonitorById,
	useDeleteMonitor,
	useUpdateMonitor,
	usePauseMonitor,
} from "../../../Hooks/monitorHooks";

const PageSpeedSetup = () => {
	const { monitorId } = useParams();
	const isCreate = typeof monitorId === "undefined";
	const CRUMBS = [
		{ name: "pagespeed", path: "/pagespeed" },
		...(isCreate
			? [{ name: "create", path: `/pagespeed/create` }]
			: [
					{ name: "details", path: `/pagespeed/${monitorId}` },
					{ name: "configure", path: `/pagespeed/configure/${monitorId}` },
				]),
	];

	// States
	const [monitor, setMonitor] = useState(
		isCreate
			? {
					url: "",
					name: "",
					type: "pagespeed",
					notifications: [],
					interval: 180000,
				}
			: {}
	);
	const [https, setHttps] = useState(true);
	const [errors, setErrors] = useState({});
	const [isOpen, setIsOpen] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);

	// Setup
	const { t } = useTranslation();
	const theme = useTheme();
	// Constants
	const MS_PER_MINUTE = 60000;
	const FREQUENCIES = [
		{ _id: 3, name: t("time.threeMinutes") },
		{ _id: 5, name: t("time.fiveMinutes") },
		{ _id: 10, name: t("time.tenMinutes") },
		{ _id: 20, name: t("time.twentyMinutes") },
		{ _id: 60, name: t("time.oneHour") },
		{ _id: 1440, name: t("time.oneDay") },
		{ _id: 10080, name: t("time.oneWeek") },
	];

	const { user } = useSelector((state) => state.auth);
	const { statusColor, pagespeedStatusMsg, determineState } = useMonitorUtils();
	const [notifications, notificationsAreLoading, notificationsError] =
		useGetNotificationsByTeamId();

	// Hooks for API actions
	const [isLoading] = useFetchMonitorById({ monitorId, setMonitor, updateTrigger });
	const [createMonitor, isCreating] = useCreateMonitor();
	const [deleteMonitor, isDeleting] = useDeleteMonitor();
	const [updateMonitor, isUpdating] = useUpdateMonitor();
	const [pauseMonitor, isPausing] = usePauseMonitor();

	// Handlers
	const onSubmit = async (event) => {
		event.preventDefault();
		if (isCreate) {
			let form = {
				url: `http${https ? "s" : ""}://` + monitor.url,
				name: monitor.name === "" ? monitor.url : monitor.name,
				type: monitor.type,
				interval: monitor.interval,
			};

			const { error } = monitorValidation.validate(form, { abortEarly: false });
			if (error) {
				const newErrors = {};
				error.details.forEach((err) => {
					newErrors[err.path[0]] = err.message;
				});
				setErrors(newErrors);
				createToast({ body: t("checkFormError") });
				return;
			}

			form = {
				...form,
				description: form.name,
				notifications: monitor.notifications,
			};
			await createMonitor({ monitor: form, redirect: "/pagespeed" });
		} else {
			const monitorParams = {
				url: monitor.url,
				name: monitor.name === "" ? monitor.url : monitor.name,
				type: monitor.type,
				interval: monitor.interval,
			};
			const { error } = monitorValidation.validate(monitorParams, { abortEarly: false });
			if (error) {
				const newErrors = {};
				error.details.forEach((err) => {
					newErrors[err.path[0]] = err.message;
				});
				setErrors(newErrors);
				console.log(newErrors);
				createToast({ body: t("checkFormError") });
				return;
			}
			await updateMonitor({ monitor, redirect: "/pagespeed" });
		}
	};

	const handleChange = (event) => {
		let { value, name } = event.target;

		if (name === "interval") {
			value = value * MS_PER_MINUTE;
		}

		setMonitor({
			...monitor,
			[name]: value,
		});

		const { error } = monitorValidation.validate(
			{ [name]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => ({
			...prev,
			...(error ? { [name]: error.details[0].message } : { [name]: undefined }),
		}));
	};

	const handleBlur = (event) => {
		const { name, value } = event.target;
		if (name === "url" && monitor.name === "") {
			setMonitor((prev) => ({ ...prev, name: parseDomainName(value) }));
		}
	};

	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const handlePause = async () => {
		await pauseMonitor({ monitorId, triggerUpdate });
	};

	const handleRemove = async (event) => {
		event.preventDefault();
		await deleteMonitor({ monitor, redirect: "/pagespeed" });
	};

	return (
		<Box
			sx={{
				"& h1": { color: theme.palette.primary.contrastText },
			}}
		>
			{Object.keys(monitor).length === 0 ? (
				<SkeletonLayout />
			) : (
				<>
					<Breadcrumbs list={CRUMBS} />
					<Stack
						component="form"
						onSubmit={onSubmit}
						noValidate
						spellCheck="false"
						gap={theme.spacing(12)}
						mt={theme.spacing(6)}
					>
						<Stack
							direction="row"
							gap={theme.spacing(2)}
						>
							<Box>
								<Typography
									component="h1"
									variant="h1"
								>
									<Typography
										component="span"
										fontSize="inherit"
										color={
											!isCreate ? theme.palette.primary.contrastTextSecondary : undefined
										}
									>
										{!isCreate ? monitor.name : t("createYour") + " "}
									</Typography>
									{isCreate ? (
										<Typography
											component="span"
											fontSize="inherit"
											fontWeight="inherit"
											color={theme.palette.primary.contrastTextSecondary}
										>
											{t("pageSpeedMonitor")}
										</Typography>
									) : (
										<></>
									)}
								</Typography>
								{!isCreate && (
									<Stack
										direction="row"
										alignItems="center"
										height="fit-content"
										gap={theme.spacing(2)}
									>
										<Tooltip
											title={pagespeedStatusMsg[determineState(monitor)]}
											disableInteractive
											slotProps={{
												popper: {
													modifiers: [
														{
															name: "offset",
															options: { offset: [0, -8] },
														},
													],
												},
											}}
										>
											<Box>
												<PulseDot color={statusColor[determineState(monitor)]} />
											</Box>
										</Tooltip>
										<Typography
											component="h2"
											variant="monitorUrl"
										>
											{monitor.url?.replace(/^https?:\/\//, "") || "..."}
										</Typography>
										<Typography
											position="relative"
											variant="body2"
											ml={theme.spacing(6)}
											mt={theme.spacing(1)}
											sx={{
												"&:before": {
													position: "absolute",
													content: `""`,
													width: 4,
													height: 4,
													borderRadius: "50%",
													backgroundColor: theme.palette.primary.contrastTextTertiary,
													opacity: 0.8,
													left: -10,
													top: "50%",
													transform: "translateY(-50%)",
												},
											}}
										>
											{t("editing")}
										</Typography>
									</Stack>
								)}
							</Box>
							{!isCreate && (
								<Box
									alignSelf="flex-end"
									ml="auto"
								>
									<Button
										onClick={handlePause}
										loading={isLoading || isCreating || isDeleting || isUpdating || isPausing}
										variant="contained"
										color="secondary"
										sx={{
											pl: theme.spacing(4),
											pr: theme.spacing(6),
											"& svg": {
												mr: theme.spacing(2),
												"& path": {
													stroke: theme.palette.primary.contrastTextTertiary,
													strokeWidth: 0.1,
												},
											},
										}}
									>
										{monitor?.isActive ? (
											<>
												<PauseCircleOutlineIcon />
												{t("pause")}
											</>
										) : (
											<>
												<PlayCircleOutlineRoundedIcon />
												{t("resume")}
											</>
										)}
									</Button>
									<Button
										loading={isLoading || isCreating || isDeleting || isUpdating || isPausing}
										variant="contained"
										color="error"
										onClick={() => setIsOpen(true)}
										sx={{ ml: theme.spacing(6) }}
									>
										{t("remove")}
									</Button>
								</Box>
							)}
						</Stack>
						<ConfigBox>
							<Box>
								<Typography
									component="h2"
									variant="h2"
								>
									{t("settingsGeneralSettings")}
								</Typography>
								<Typography component="p">
									{t("pageSpeedConfigureSettingsDescription")}
								</Typography>
							</Box>
							<Stack
								gap={!isCreate ? theme.spacing(20) : theme.spacing(15)}
								sx={{
									".MuiInputBase-root:has(> .Mui-disabled)": {
										backgroundColor: theme.palette.tertiary.main,
									},
								}}
							>
								<TextInput
									type={"url"}
									name="url"
									id="monitor-url"
									label={!isCreate ? t("url") : t("urlMonitor")}
									startAdornment={isCreate ? <HttpAdornment https={https} /> : undefined}
									placeholder="random.website.com"
									value={monitor.url || ""}
									onChange={handleChange}
									onBlur={isCreate ? handleBlur : undefined}
									error={!!errors["url"]}
									helperText={errors["url"]}
									disabled={!isCreate}
								/>
								<TextInput
									type="text"
									id="monitor-name"
									name="name"
									label={t("monitorDisplayName")}
									isOptional={true}
									placeholder="Google"
									value={monitor.name || ""}
									onChange={handleChange}
									error={!!errors["name"]}
									helperText={errors["name"]}
								/>
							</Stack>
						</ConfigBox>
						{isCreate && (
							<ConfigBox>
								<Box>
									<Typography
										component="h2"
										variant="h2"
									>
										{t("distributedUptimeCreateChecks")}
									</Typography>
									<Typography component="p">
										{t("distributedUptimeCreateChecksDescription")}
									</Typography>
								</Box>
								<Stack gap={theme.spacing(12)}>
									<Stack gap={theme.spacing(6)}>
										<Radio
											id="monitor-checks-http"
											title="PageSpeed"
											desc={t("pageSpeedLighthouseAPI")}
											size="small"
											value="http"
											checked={monitor.type === "pagespeed"}
										/>
										<ButtonGroup sx={{ ml: "32px" }}>
											<Button
												variant="group"
												filled={https.toString()}
												onClick={() => setHttps(true)}
											>
												{t("https")}
											</Button>
											<Button
												variant="group" // Why does this work?
												filled={(!https).toString()} // There's nothing in the docs about this either
												onClick={() => setHttps(false)}
											>
												{t("http")}
											</Button>
										</ButtonGroup>
									</Stack>
									{errors["type"] ? (
										<Box>
											<Typography
												component="p"
												color={theme.palette.error.contrastText}
											>
												{errors["type"]}
											</Typography>
										</Box>
									) : (
										""
									)}
								</Stack>
							</ConfigBox>
						)}
						<ConfigBox>
							<Box>
								<Typography
									component="h2"
									variant="h2"
								>
									{t("notificationConfig.title")}
								</Typography>
								<Typography component="p">
									{t("notificationConfig.description")}
								</Typography>
							</Box>
							<NotificationsConfig
								notifications={notifications}
								setMonitor={setMonitor}
								setNotifications={isCreate ? undefined : monitor.notifications}
							/>
						</ConfigBox>
						<ConfigBox>
							<Box>
								<Typography
									component="h2"
									variant="h2"
								>
									{t("distributedUptimeCreateAdvancedSettings")}
								</Typography>
							</Box>
							<Stack gap={theme.spacing(isCreate ? 12 : 20)}>
								<Select
									id="monitor-interval"
									name="interval"
									label={t("checkFrequency")}
									value={monitor?.interval / MS_PER_MINUTE || 3}
									onChange={handleChange}
									items={FREQUENCIES}
								/>
							</Stack>
						</ConfigBox>
						<Stack
							direction="row"
							justifyContent="flex-end"
							mt={isCreate ? undefined : "auto"}
						>
							<Button
								type="submit"
								variant="contained"
								color="accent"
								loading={isLoading || isCreating || isDeleting || isUpdating || isPausing}
								disabled={!Object.values(errors).every((value) => value === undefined)}
								sx={isCreate ? undefined : { px: theme.spacing(12) }}
							>
								{isCreate ? t("createMonitor") : t("settingsSave")}
							</Button>
						</Stack>
					</Stack>
				</>
			)}
			{!isCreate && (
				<Dialog
					open={isOpen}
					theme={theme}
					title={t("deleteDialogTitle")}
					description={t("deleteDialogDescription")}
					onCancel={() => setIsOpen(false)}
					confirmationButtonLabel={t("delete")}
					onConfirm={handleRemove}
				/>
			)}
		</Box>
	);
};

export default PageSpeedSetup;

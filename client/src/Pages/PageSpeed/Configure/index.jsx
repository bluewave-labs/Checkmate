import { useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
import { Box, Stack, Tooltip, Typography, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import {
	deletePageSpeed,
	getPagespeedMonitorById,
	getPageSpeedByTeamId,
	updatePageSpeed,
	pausePageSpeed,
} from "../../../Features/PageSpeedMonitor/pageSpeedMonitorSlice";
import { monitorValidation } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import { logger } from "../../../Utils/Logger";
import { useTranslation } from "react-i18next";
import ConfigBox from "../../../Components/ConfigBox";
import TextInput from "../../../Components/Inputs/TextInput";
import Select from "../../../Components/Inputs/Select";
import Checkbox from "../../../Components/Inputs/Checkbox";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import PulseDot from "../../../Components/Animated/PulseDot";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import SkeletonLayout from "./skeleton";
import useUtils from "../../Uptime/Monitors/Hooks/useUtils";
import "./index.css";
import Dialog from "../../../Components/Dialog";

const PageSpeedConfigure = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const MS_PER_MINUTE = 60000;
	const { user } = useSelector((state) => state.auth);
	const { isLoading } = useSelector((state) => state.pageSpeedMonitors);
	const { monitorId } = useParams();
	const [monitor, setMonitor] = useState({});
	const [errors, setErrors] = useState({});
	const { statusColor, pagespeedStatusMsg, determineState } = useUtils();
	const [buttonLoading, setButtonLoading] = useState(false);
	const idMap = {
		"monitor-url": "url",
		"monitor-name": "name",
		"monitor-checks-http": "type",
		"monitor-checks-ping": "type",
		"notify-email-default": "notification-email",
	};

	const frequencies = [
		{ _id: 3, name: "3 minutes" },
		{ _id: 5, name: "5 minutes" },
		{ _id: 10, name: "10 minutes" },
		{ _id: 20, name: "20 minutes" },
		{ _id: 60, name: "1 hour" },
		{ _id: 1440, name: "1 day" },
		{ _id: 10080, name: "1 week" },
	];

	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				const action = await dispatch(getPagespeedMonitorById({ monitorId }));

				if (getPagespeedMonitorById.fulfilled.match(action)) {
					const monitor = action.payload.data;
					setMonitor(monitor);
				} else if (getPagespeedMonitorById.rejected.match(action)) {
					throw new Error(action.error.message);
				}
			} catch (error) {
				logger.error("Error fetching monitor of id: " + monitorId);
				navigate("/not-found", { replace: true });
			}
		};
		fetchMonitor();
	}, [dispatch, monitorId, navigate]);

	const handleChange = (event, name) => {
		let { value, id } = event.target;
		if (!name) name = idMap[id];

		if (name.includes("notification-")) {
			name = name.replace("notification-", "");
			let hasNotif = monitor.notifications.some(
				(notification) => notification.type === name
			);
			setMonitor((prev) => {
				const notifs = [...prev.notifications];
				if (hasNotif) {
					return {
						...prev,
						notifications: notifs.filter((notif) => notif.type !== name),
					};
				} else {
					return {
						...prev,
						notifications: [
							...notifs,
							name === "email"
								? { type: name, address: value }
								: // TODO - phone number
									{ type: name, phone: value },
						],
					};
				}
			});
		} else {
			if (name === "interval") {
				value = value * MS_PER_MINUTE;
			}
			setMonitor((prev) => ({
				...prev,
				[name]: value,
			}));

			const validation = monitorValidation.validate(
				{ [name]: value },
				{ abortEarly: false }
			);

			setErrors((prev) => {
				const updatedErrors = { ...prev };

				if (validation.error) updatedErrors[name] = validation.error.details[0].message;
				else delete updatedErrors[name];
				return updatedErrors;
			});
		}
	};

	const handlePause = async () => {
		try {
			const action = await dispatch(pausePageSpeed({ monitorId }));
			if (pausePageSpeed.fulfilled.match(action)) {
				const monitor = action.payload.data;
				setMonitor(monitor);
				const state = action?.payload?.data.isActive === false ? "paused" : "resumed";
				createToast({ body: `Monitor ${state} successfully.` });
			} else if (pausePageSpeed.rejected.match(action)) {
				throw new Error(action.error.message);
			}
		} catch (error) {
			logger.error("Error pausing monitor: " + monitorId);
			createToast({ body: "Failed to pause monitor" });
		}
	};

	const handleSave = async (event) => {
		event.preventDefault();
		const action = await dispatch(updatePageSpeed({ monitor: monitor }));
		if (action.meta.requestStatus === "fulfilled") {
			createToast({ body: "Monitor updated successfully!" });
			dispatch(getPageSpeedByTeamId());
		} else {
			createToast({ body: "Failed to update monitor." });
		}
	};

	const [isOpen, setIsOpen] = useState(false);
	const handleRemove = async (event) => {
		event.preventDefault();
		setButtonLoading(true);
		const action = await dispatch(deletePageSpeed({ monitor }));
		if (action.meta.requestStatus === "fulfilled") {
			navigate("/pagespeed");
		} else {
			createToast({ body: "Failed to delete monitor." });
		}
		setButtonLoading(false);
	};

	return (
		<Stack
			className="configure-pagespeed"
			gap={theme.spacing(10)}
		>
			{Object.keys(monitor).length === 0 ? (
				<SkeletonLayout />
			) : (
				<>
					<Breadcrumbs
						list={[
							{ name: "pagespeed", path: "/pagespeed" },
							{ name: "details", path: `/pagespeed/${monitorId}` },
							{ name: "configure", path: `/pagespeed/configure/${monitorId}` },
						]}
					/>
					<Stack
						component="form"
						noValidate
						spellCheck="false"
						onSubmit={handleSave}
						flex={1}
						gap={theme.spacing(10)}
					>
						<Stack
							direction="row"
							gap={theme.spacing(2)}
						>
							<Box>
								<Typography
									component="h1"
									variant="monitorName"
								>
									{monitor.name}
								</Typography>
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
														options: {
															offset: [0, -8],
														},
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
							</Box>
							<Box
								alignSelf="flex-end"
								ml="auto"
							>
								<Button
									onClick={handlePause}
									loading={isLoading}
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
									loading={isLoading}
									variant="contained"
									color="error"
									onClick={() => setIsOpen(true)}
									sx={{
										ml: theme.spacing(6),
									}}
								>
									{t("remove")}
								</Button>
							</Box>
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
								gap={theme.spacing(20)}
								sx={{
									".MuiInputBase-root:has(> .Mui-disabled)": {
										backgroundColor: theme.palette.tertiary.main,
									},
								}}
							>
								<TextInput
									type="url"
									id="monitor-url"
									label={t("url")}
									placeholder="random.website.com"
									value={monitor?.url || ""}
									onChange={handleChange}
									error={errors.url ? true : false}
									helperText={errors.url}
									disabled={true}
								/>
								<TextInput
									type="text"
									id="monitor-name"
									label={t("monitorDisplayName")}
									placeholder="Example monitor"
									isOptional={true}
									value={monitor?.name || ""}
									onChange={handleChange}
									error={errors.name ? true : false}
									helperText={errors.name}
								/>
							</Stack>
						</ConfigBox>
						<ConfigBox>
							<Box>
								<Typography
									component="h2"
									variant="h2"
								>
									{t("distributedUptimeCreateIncidentNotification")}
								</Typography>
								<Typography component="p">
									{t("distributedUptimeCreateIncidentDescription")}
								</Typography>
							</Box>
							<Stack gap={theme.spacing(6)}>
								<Typography component="p">{t("whenNewIncident")}</Typography>
								{/* Future Feature: Notify via SMS */}
								{/* <Checkbox
									id="notify-sms"
									label={t("notifySMS")}
									isChecked={false}
									value=""
									onChange={() => logger.warn("disabled")}
									isDisabled={true}
								/> */}
								<Checkbox
									id="notify-email-default"
									label={`Notify via email (to ${user.email})`}
									isChecked={
										monitor?.notifications?.some(
											(notification) => notification.type === "email"
										) || false
									}
									value={user?.email}
									onChange={(event) => handleChange(event)}
								/>
								{/* Future Feature: Notify via Email */}
								{/* <Checkbox
									id="notify-email"
									label={t("notifyEmails")}
									isChecked={false}
									value=""
									onChange={() => logger.warn("disabled")}
									isDisabled={true}
								/> */}
								{monitor?.notifications?.some(
									(notification) => notification.type === "emails"
								) ? (
									<Box mx={theme.spacing(16)}>
										<TextInput
											id="notify-email-list"
											type="text"
											placeholder="name@gmail.com"
											value=""
											onChange={() => logger.warn("disabled")}
										/>
										<Typography mt={theme.spacing(4)}>{t("seperateEmails")}</Typography>
									</Box>
								) : (
									""
								)}
							</Stack>
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
							<Stack gap={theme.spacing(20)}>
								<Select
									id="monitor-frequency"
									label={t("checkFrequency")}
									items={frequencies}
									value={monitor?.interval / MS_PER_MINUTE || 3}
									onChange={(event) => handleChange(event, "interval")}
								/>
							</Stack>
						</ConfigBox>
						<Stack
							direction="row"
							justifyContent="flex-end"
							mt="auto"
						>
							<Button
								loading={isLoading}
								type="submit"
								variant="contained"
								color="accent"
								onClick={handleSave}
								sx={{ px: theme.spacing(12) }}
							>
								{t("settingsSave")}
							</Button>
						</Stack>
					</Stack>
				</>
			)}
			<Dialog
				open={isOpen}
				theme={theme}
				title={t("deleteDialogTitle")}
				description={t("deleteDialogDescription")}
				onCancel={() => setIsOpen(false)}
				confirmationButtonLabel={t("delete")}
				onConfirm={handleRemove}
				isLoading={buttonLoading}
			/>
		</Stack>
	);
};

export default PageSpeedConfigure;

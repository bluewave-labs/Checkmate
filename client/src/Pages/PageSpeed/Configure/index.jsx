// Components
import { Box, Stack, Tooltip, Typography, Button } from "@mui/material";
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

// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useParams } from "react-router";
import { monitorValidation } from "../../../Validation/validation";
import { useTranslation } from "react-i18next";
import { useMonitorUtils } from "../../../Hooks/useMonitorUtils";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import {
	useFetchMonitorById,
	useDeleteMonitor,
	useUpdateMonitor,
	usePauseMonitor,
} from "../../../Hooks/monitorHooks";
const PageSpeedConfigure = () => {
	// Redux state

	// Local state
	const [monitor, setMonitor] = useState({});
	const [errors, setErrors] = useState({});
	const [isOpen, setIsOpen] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);

	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const MS_PER_MINUTE = 60000;
	const { monitorId } = useParams();
	const { statusColor, pagespeedStatusMsg, determineState } = useMonitorUtils();

	const [notifications, notificationsAreLoading, notificationsError] =
		useGetNotificationsByTeamId();

	const [isLoading] = useFetchMonitorById({ monitorId, setMonitor, updateTrigger });
	const [deleteMonitor, isDeleting] = useDeleteMonitor();
	const [updateMonitor, isUpdating] = useUpdateMonitor();
	const [pauseMonitor, isPausing] = usePauseMonitor();

	const frequencies = [
		{ _id: 3, name: "3 minutes" },
		{ _id: 5, name: "5 minutes" },
		{ _id: 10, name: "10 minutes" },
		{ _id: 20, name: "20 minutes" },
		{ _id: 60, name: "1 hour" },
		{ _id: 1440, name: "1 day" },
		{ _id: 10080, name: "1 week" },
	];

	// Handlers
	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const onChange = (event) => {
		let { value, name } = event.target;

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
	};

	const handlePause = async () => {
		await pauseMonitor({ monitorId, triggerUpdate });
	};

	const onSubmit = async (event) => {
		event.preventDefault();
		await updateMonitor({ monitor, redirect: "/pagespeed" });
	};

	const handleRemove = async (event) => {
		event.preventDefault();
		await deleteMonitor({ monitor, redirect: "/pagespeed" });
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
						onSubmit={onSubmit}
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
									name="url"
									type="url"
									label={t("url")}
									placeholder="random.website.com"
									value={monitor?.url || ""}
									onChange={onChange}
									error={errors.url ? true : false}
									helperText={errors.url}
									disabled={true}
								/>
								<TextInput
									name="name"
									type="text"
									label={t("monitorDisplayName")}
									placeholder="Example monitor"
									isOptional={true}
									value={monitor?.name || ""}
									onChange={onChange}
									error={errors.name ? true : false}
									helperText={errors.name}
								/>
							</Stack>
						</ConfigBox>
						<ConfigBox>
							<Box>
								<Typography component="h2">{t("notificationConfig.title")}</Typography>
								<Typography component="p">
									{t("notificationConfig.description")}
								</Typography>
							</Box>
							<NotificationsConfig
								notifications={notifications}
								setMonitor={setMonitor}
								setNotifications={monitor.notifications}
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
							<Stack gap={theme.spacing(20)}>
								<Select
									name="interval"
									label={t("checkFrequency")}
									items={frequencies}
									value={monitor?.interval / MS_PER_MINUTE || 3}
									onChange={onChange}
								/>
							</Stack>
						</ConfigBox>
						<Stack
							direction="row"
							justifyContent="flex-end"
							mt="auto"
						>
							<Button
								loading={isLoading || isDeleting || isUpdating || isPausing}
								type="submit"
								variant="contained"
								color="accent"
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
				isLoading={isLoading || isDeleting || isUpdating || isPausing}
			/>
		</Stack>
	);
};

export default PageSpeedConfigure;

//Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import ConfigBox from "../../../Components/ConfigBox";
import FieldWrapper from "../../../Components/Inputs/FieldWrapper";
import Link from "../../../Components/Link";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import MonitorStatusHeader from "./Components/MonitorStatusHeader";
import MonitorActionButtons from "./Components/MonitorActionButtons";
import CustomAlertsSection from "./Components/CustomAlertsSection";
// Utils
import NotificationsConfig from "../../../Components/NotificationConfig";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import {
	useDeleteMonitor,
	useFetchGlobalSettings,
	useFetchHardwareMonitorById,
	usePauseMonitor,
} from "../../../Hooks/monitorHooks";
import useInfrastructureMonitorForm from "./hooks/useInfrastructureMonitorForm";
import useValidateInfrastructureForm from "./hooks/useValidateInfrastructureForm";
import useInfrastructureSubmit from "./hooks/useInfrastructureSubmit";

const CreateInfrastructureMonitor = () => {
	const { monitorId } = useParams();
	const isCreate = typeof monitorId === "undefined";

	const theme = useTheme();
	const { t } = useTranslation();

	// State
	const [https, setHttps] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);

	// Fetch monitor details if editing
	const [monitor, isLoading] = useFetchHardwareMonitorById({
		monitorId,
		updateTrigger,
	});
	const [deleteMonitor, isDeleting] = useDeleteMonitor();
	const [globalSettings, globalSettingsLoading] = useFetchGlobalSettings();
	const [notifications, notificationsAreLoading] = useGetNotificationsByTeamId();
	const [pauseMonitor, isPausing] = usePauseMonitor();
	const {
		infrastructureMonitor,
		setInfrastructureMonitor,
		onChangeForm,
		handleCheckboxChange,
		initializeInfrastructureMonitorForCreate,
		initializeInfrastructureMonitorForUpdate,
	} = useInfrastructureMonitorForm();
	const { errors, validateField, validateForm } = useValidateInfrastructureForm();
	const { buildForm, submitInfrastructureForm, isCreating, isUpdating } =
		useInfrastructureSubmit();

	const FREQUENCIES = [
		{ _id: 0.25, name: t("time.fifteenSeconds") },
		{ _id: 0.5, name: t("time.thirtySeconds") },
		{ _id: 1, name: t("time.oneMinute") },
		{ _id: 2, name: t("time.twoMinutes") },
		{ _id: 5, name: t("time.fiveMinutes") },
		{ _id: 10, name: t("time.tenMinutes") },
	];
	const CRUMBS = [
		{ name: "Infrastructure monitors", path: "/infrastructure" },
		...(isCreate
			? [{ name: "Create", path: "/infrastructure/create" }]
			: [
					{ name: "Details", path: `/infrastructure/${monitorId}` },
					{ name: "Configure", path: `/infrastructure/configure/${monitorId}` },
				]),
	];
	// Populate form fields if editing
	useEffect(() => {
		if (isCreate) {
			if (globalSettingsLoading) return;
			setHttps(false);
			initializeInfrastructureMonitorForCreate(globalSettings);
		} else if (monitor) {
			setHttps(monitor.url.startsWith("https"));
			initializeInfrastructureMonitorForUpdate(monitor);
		}
	}, [isCreate, monitor, globalSettings, globalSettingsLoading]);

	// Handlers
	const onSubmit = async (event) => {
		event.preventDefault();
		const form = buildForm(infrastructureMonitor, https);
		const error = validateForm(form);
		if (error) {
			return;
		}
		submitInfrastructureForm(infrastructureMonitor, form, isCreate, monitorId);
	};

	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const onChange = (event) => {
		const { value, name } = event.target;
		onChangeForm(name, value);
		validateField(name, value);
	};

	const handlePause = async () => {
		await pauseMonitor({ monitorId, triggerUpdate });
	};

	const handleRemove = async (event) => {
		event.preventDefault();
		await deleteMonitor({ monitor, redirect: "/infrastructure" });
	};

	const isBusy =
		isLoading ||
		isUpdating ||
		isCreating ||
		isDeleting ||
		isPausing ||
		notificationsAreLoading;

	return (
		<Box className="create-infrastructure-monitor">
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
								{!isCreate ? infrastructureMonitor.name : t("createYour") + " "}
							</Typography>
							{isCreate ? (
								<Typography
									component="span"
									fontSize="inherit"
									fontWeight="inherit"
									color={theme.palette.primary.contrastTextSecondary}
								>
									{t("monitor")}
								</Typography>
							) : (
								<></>
							)}
						</Typography>
						{!isCreate && (
							<MonitorStatusHeader
								monitor={monitor}
								infrastructureMonitor={infrastructureMonitor}
							/>
						)}
					</Box>
					{!isCreate && (
						<MonitorActionButtons
							monitor={monitor}
							isBusy={isBusy}
							handlePause={handlePause}
							handleRemove={handleRemove}
						/>
					)}
				</Stack>
				<ConfigBox>
					<Stack>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
						<Typography component="p">
							{t("infrastructureCreateGeneralSettingsDescription")}
						</Typography>
						<Typography component="p">
							{t("infrastructureServerRequirement")}{" "}
							<Link
								level="primary"
								url="https://github.com/bluewave-labs/checkmate-agent"
								label={t("common.monitoringAgentName")}
							/>
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(8)}>
						<TextInput
							type="url"
							id="url"
							name="url"
							startAdornment={<HttpAdornment https={https} />}
							placeholder={"localhost:59232/api/v1/metrics"}
							label={t("infrastructureServerUrlLabel")}
							https={https}
							value={infrastructureMonitor.url}
							onChange={onChange}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
							disabled={!isCreate}
						/>
						{isCreate && (
							<FieldWrapper
								label={t("infrastructureProtocol")}
								labelVariant="p"
							>
								<ButtonGroup>
									<Button
										variant="group"
										filled={https.toString()}
										onClick={() => setHttps(true)}
									>
										{t("https")}
									</Button>
									<Button
										variant="group"
										filled={(!https).toString()}
										onClick={() => setHttps(false)}
									>
										{t("http")}
									</Button>
								</ButtonGroup>
							</FieldWrapper>
						)}
						<TextInput
							type="text"
							id="name"
							name="name"
							label={t("infrastructureDisplayNameLabel")}
							placeholder="Google"
							isOptional={true}
							value={infrastructureMonitor.name}
							onChange={onChange}
							error={errors["name"]}
						/>
						<TextInput
							type="text"
							id="group"
							name="group"
							label={t("group")}
							placeholder={t("groupPlaceholder")}
							isOptional={true}
							value={infrastructureMonitor.group}
							onChange={onChange}
							error={errors["group"]}
						/>
						<TextInput
							type="text"
							id="secret"
							name="secret"
							label={t("infrastructureAuthorizationSecretLabel")}
							value={infrastructureMonitor.secret}
							onChange={onChange}
							error={errors["secret"] ? true : false}
							helperText={errors["secret"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("notificationConfig.title")}
						</Typography>
						<Typography component="p">{t("notificationConfig.description")}</Typography>
					</Box>
					<NotificationsConfig
						notifications={notifications}
						setMonitor={setInfrastructureMonitor}
						setNotifications={infrastructureMonitor.notifications}
					/>
				</ConfigBox>
				<CustomAlertsSection
					errors={errors}
					onChange={onChange}
					infrastructureMonitor={infrastructureMonitor}
					handleCheckboxChange={handleCheckboxChange}
				/>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("distributedUptimeCreateAdvancedSettings")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Select
							id="interval"
							name="interval"
							label="Check frequency"
							value={infrastructureMonitor.interval || 15}
							onChange={onChange}
							items={FREQUENCIES}
						/>
					</Stack>
				</ConfigBox>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						type="submit"
						variant="contained"
						color="accent"
						loading={isBusy}
					>
						{t(isCreate ? "infrastructureCreateMonitor" : "infrastructureEditMonitor")}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default CreateInfrastructureMonitor;

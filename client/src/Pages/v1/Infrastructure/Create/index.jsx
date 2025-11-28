//Components
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import FieldWrapper from "@/Components/v1/Inputs/FieldWrapper/index.jsx";
import Link from "@/Components/v1/Link/index.jsx";
import Select from "@/Components/v1/Inputs/Select/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import { Box, Stack, Typography, Button, ButtonGroup } from "@mui/material";
import { HttpAdornment } from "@/Components/v1/Inputs/TextInput/Adornments/index.jsx";
import MonitorStatusHeader from "./Components/MonitorStatusHeader.jsx";
import MonitorActionButtons from "./Components/MonitorActionButtons.jsx";
import CustomAlertsSection from "./Components/CustomAlertsSection.jsx";
import DiskSelection from "./Components/DiskSelection.jsx";
// Utils
import NotificationsConfig from "@/Components/v1/NotificationConfig/index.jsx";
import { useGetNotificationsByTeamId } from "../../../../Hooks/v1/useNotifications.js";
import NetworkService from "../../../../Utils/NetworkService";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import {
	useDeleteMonitor,
	useFetchGlobalSettings,
	useFetchHardwareMonitorById,
	usePauseMonitor,
} from "../../../../Hooks/v1/monitorHooks.js";
import useInfrastructureMonitorForm from "./hooks/useInfrastructureMonitorForm.jsx";
import useValidateInfrastructureForm from "./hooks/useValidateInfrastructureForm.jsx";
import useInfrastructureSubmit from "./hooks/useInfrastructureSubmit.jsx";

const CreateInfrastructureMonitor = () => {
	const { monitorId } = useParams();
	const isCreate = typeof monitorId === "undefined";

	const theme = useTheme();
	const { t } = useTranslation();

	// State
	const [https, setHttps] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [availableDisks, setAvailableDisks] = useState([]);

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
			const fetchLastCheck = async () => {
            try {
                const params = {
                    dateRange: "recent",
                    limit: 1,
                    sortOrder: "desc",
                };
                // On utilise NetworkService directement
                const response = await NetworkService.get(`/api/v1/checks/${monitorId}`, { params });
                const disks = response?.data?.checks?.[0]?.payload?.disks || [];
                setAvailableDisks(disks);
            } catch (error) {
                console.error("Erreur pendant la récupération des disques:", error);
                setAvailableDisks([]); // En cas d'erreur, on met un tableau vide
            }
        };

        fetchLastCheck();
		}
	}, [
		isCreate,
		monitor,
		globalSettings,
		globalSettingsLoading,
		initializeInfrastructureMonitorForCreate,
		initializeInfrastructureMonitorForUpdate,
	]);

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

	// --- AJOUT TEMPORAIRE : Fausses données ---
    const MOCK_DISKS = [
        { mountpoint: "C:" },
        { mountpoint: "D:" },
        { mountpoint: "/mnt/data" },
        { mountpoint: "/var/lib/docker" }
    ];
    // -----------------------------------------

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
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("createMonitorPage.incidentConfigTitle")}
						</Typography>
						<Typography component="p">
							{t("createMonitorPage.incidentConfigDescription")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(20)}>
						<TextInput
							name="statusWindowSize"
							label={t("createMonitorPage.incidentConfigStatusWindowLabel")}
							type="number"
							value={infrastructureMonitor.statusWindowSize}
							onChange={onChange}
							error={errors["statusWindowSize"] ? true : false}
							helperText={errors["statusWindowSize"]}
						/>
						<TextInput
							name="statusWindowThreshold"
							label={t("createMonitorPage.incidentConfigStatusWindowThresholdLabel")}
							type="number"
							value={infrastructureMonitor.statusWindowThreshold}
							onChange={onChange}
							error={errors["statusWindowThreshold"] ? true : false}
							helperText={errors["statusWindowThreshold"]}
						/>
					</Stack>
				</ConfigBox>
				<CustomAlertsSection
					errors={errors}
					onChange={onChange}
					infrastructureMonitor={infrastructureMonitor}
					handleCheckboxChange={handleCheckboxChange}
				/>

				{monitorId && (
                    <DiskSelection
                        availableDisks={availableDisks}
                        selectedDisks={infrastructureMonitor.selectedDisks}
                        onChange={(newSelectedDisks) =>
                            onChangeForm("selectedDisks", newSelectedDisks)
                        }
                    />
                )}
				
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

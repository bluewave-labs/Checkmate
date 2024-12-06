import { useEffect, useState } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useSelector, useDispatch } from "react-redux";
import { infrastructureMonitorValidation } from "../../../Validation/validation";
import { parseDomainName } from "../../../Utils/monitorUtils";
import {
	createInfrastructureMonitor,
	checkInfrastructureEndpointResolution,
	getInfrastructureMonitorById,
} from "../../../Features/InfrastructureMonitors/infrastructureMonitorsSlice";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { createToast } from "../../../Utils/toastUtils";
import Link from "../../../Components/Link";
import { ConfigBox } from "../../Monitors/styled";
import TextInput from "../../../Components/Inputs/TextInput";
import Select from "../../../Components/Inputs/Select";
import Checkbox from "../../../Components/Inputs/Checkbox";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { buildErrors, hasValidationErrors } from "../../../Validation/error";
import { capitalizeFirstLetter } from "../../../Utils/stringUtils";
import { CustomThreshold } from "../CreateMonitor/CustomThreshold";
import useUtils from "../../Monitors/utils";
import PulseDot from "../../../Components/Animated/PulseDot";
import PauseIcon from "../../../assets/icons/pause-icon.svg?react";
import ResumeIcon from "../../../assets/icons/resume-icon.svg?react";

const ConfigureInfrastructureMonitor = () => {
	const MS_PER_MINUTE = 60000;
	const THRESHOLD_FIELD_PREFIX = "usage_";
	const HARDWARE_MONITOR_TYPES = ["cpu", "memory", "disk", "temperature"];
	const { user, authToken } = useSelector((state) => state.auth);
	const { monitorId } = useParams();
	const { isLoading, selectedInfraMonitor, msg } = useSelector(
		(state) => state.infrastructureMonitors
	);
	const [infrastructureMonitor, setInfrastructureMonitor] = useState(null);
	const { statusColor, statusMsg, determineState } = useUtils();
	const [errors, setErrors] = useState({});
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const idMap = {
		"notify-email-default": "notification-email",
	};

	const alertErrKeyLen = Object.keys(errors).filter((k) =>
		k.startsWith(THRESHOLD_FIELD_PREFIX)
	).length;

	useEffect(() => {
		dispatch(getInfrastructureMonitorById({ authToken, monitorId }));
	}, [monitorId, authToken]);

	useEffect(() => {
		if (msg) navigate("/not-found", { replace: true });
	}, [msg, navigate]);

	useEffect(() => {
		setInfrastructureMonitor(selectedInfraMonitor);
	}, [selectedInfraMonitor]);

	const handleCustomAlertCheckChange = (event) => {
		const { value, id } = event.target;
		setInfrastructureMonitor((prev) => {
			const newState = {
				[id]: prev[id] == undefined && value == "on" ? true : !prev[id],
			};
			return {
				...prev,
				...newState,
				[THRESHOLD_FIELD_PREFIX + id]: newState[id]
					? prev[THRESHOLD_FIELD_PREFIX + id]
					: "",
			};
		});
		// Remove the error if unchecked
		setErrors((prev) => {
			return buildErrors(prev, [THRESHOLD_FIELD_PREFIX + id]);
		});
	};

	const handleBlur = (event, appendID) => {
		event.preventDefault();
		const { value, id } = event.target;

		let name = idMap[id] ?? id;
		if (name === "url" && infrastructureMonitor?.name === "") {
			setInfrastructureMonitor((prev) => ({
				...prev,
				name: parseDomainName(value),
			}));
		}

		if (id?.startsWith("notify-email-")) return;
		const { error } = infrastructureMonitorValidation.validate(
			{ [id ?? appendID]: value },
			{
				abortEarly: false,
			}
		);
		setErrors((prev) => {
			return buildErrors(prev, id ?? appendID, error);
		});
	};

	const handleChange = (event, appendedId) => {
		event.preventDefault();
		const { value, id } = event.target;
		let name = appendedId ?? idMap[id] ?? id;
		if (name.includes("notification-")) {
			name = name.replace("notification-", "");
			let hasNotif = infrastructureMonitor.notifications.some(
				(notification) => notification.type === name
			);
			setInfrastructureMonitor((prev) => {
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
			setInfrastructureMonitor((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const generatePayload = (form) => {
		let thresholds = {};
		Object.keys(form)
			.filter((k) => k.startsWith(THRESHOLD_FIELD_PREFIX))
			.map((k) => {
				if (form[k]) thresholds[k] = form[k] / 100;
				delete form[k];
				delete form[k.substring(THRESHOLD_FIELD_PREFIX.length)];
			});

		form = {
			...form,
			description: form.name,
			teamId: user.teamId,
			userId: user._id,
			type: "hardware",
			notifications: infrastructureMonitor.notifications,
			thresholds,
		};
		return form;
	};
	const handleCreateInfrastructureMonitor = async (event) => {
		event.preventDefault();
		let form = {
			...infrastructureMonitor,
			name:
				infrastructureMonitor.name === ""
					? infrastructureMonitor.url
					: infrastructureMonitor.name,
			interval: infrastructureMonitor.interval * MS_PER_MINUTE,
		};

		delete form.notifications;
		if (hasValidationErrors(form, infrastructureMonitorValidation, setErrors)) {
			return;
		} else {
			const checkEndpointAction = await dispatch(
				checkInfrastructureEndpointResolution({ authToken, monitorURL: form.url })
			);
			if (checkEndpointAction.meta.requestStatus === "rejected") {
				createToast({
					body: "The endpoint you entered doesn't resolve. Check the URL again.",
				});
				setErrors({ url: "The entered URL is not reachable." });
				return;
			}
			const action = await dispatch(
				createInfrastructureMonitor({ authToken, monitor: generatePayload(form) })
			);
			if (action.meta.requestStatus === "fulfilled") {
				createToast({ body: "Infrastructure monitor created successfully!" });
				navigate("/infrastructure");
			} else {
				createToast({ body: "Failed to create monitor." });
			}
		}
	};

	//select values
	const frequencies = [
		{ _id: 0.25, name: "15 seconds" },
		{ _id: 0.5, name: "30 seconds" },
		{ _id: 1, name: "1 minute" },
		{ _id: 2, name: "2 minutes" },
		{ _id: 5, name: "5 minutes" },
		{ _id: 10, name: "10 minutes" },
	];

	return (
		infrastructureMonitor && (
			<Box className="create-infrastructure-monitor">
				<Breadcrumbs
					list={[
						{ name: "Infrastructure monitors", path: "/infrastructure" },
						{ name: "details", path: `/infrastructure/${monitorId}` },
						{ name: "configure", path: `/infrastructure/configure/${monitorId}` },
					]}
				/>
				<Stack
					component="form"
					onSubmit={handleCreateInfrastructureMonitor}
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
								{infrastructureMonitor.name}
							</Typography>
							<Stack
								direction="row"
								alignItems="center"
								height="fit-content"
								gap={theme.spacing(2)}
							>
								<Tooltip
									title={statusMsg[determineState(infrastructureMonitor)]}
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
										<PulseDot
											color={statusColor[determineState(infrastructureMonitor)]}
										/>
									</Box>
								</Tooltip>
								<Typography
									component="h2"
									variant="h2"
								>
									{infrastructureMonitor.url?.replace(/^https?:\/\//, "") || "..."}
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
											backgroundColor: theme.palette.text.tertiary,
											opacity: 0.8,
											left: -10,
											top: "50%",
											transform: "translateY(-50%)",
										},
									}}
								>
									Editting...
								</Typography>
							</Stack>
						</Box>
						<Box
							sx={{
								alignSelf: "flex-end",
								ml: "auto",
							}}
						>
							<LoadingButton
								variant="contained"
								color="secondary"
								loading={isLoading}
								sx={{
									pl: theme.spacing(4),
									pr: theme.spacing(6),
									mr: theme.spacing(6),
									"& svg": {
										mr: theme.spacing(2),
										width: 22,
										height: 22,
										"& path": {
											stroke: theme.palette.text.tertiary,
											strokeWidth: 1.7,
										},
									},
								}}
								onClick={() => console.log("handle pause")}
							>
								{infrastructureMonitor?.isActive ? (
									<>
										<PauseIcon />
										Pause
									</>
								) : (
									<>
										<ResumeIcon />
										Resume
									</>
								)}
							</LoadingButton>
							<LoadingButton
								loading={isLoading}
								variant="contained"
								color="error"
								sx={{ px: theme.spacing(8) }}
								onClick={() => setIsOpen(true)}
							>
								Remove
							</LoadingButton>
						</Box>
					</Stack>
					<ConfigBox>
						<Box>
							<Stack gap={theme.spacing(6)}>
								<Typography component="h2">General settings</Typography>
								<Typography component="p">
									Here you can select the URL of the host, together with the friendly name
									and authorization secret to connect to the server agent.
								</Typography>
								<Typography component="p">
									The server you are monitoring must be running the{" "}
									<Link
										level="primary"
										url="https://github.com/bluewave-labs/checkmate-agent"
										label="Checkmate Monitoring Agent"
									/>
								</Typography>
							</Stack>
						</Box>
						<Stack gap={theme.spacing(15)}>
							<TextInput
								type="text"
								id="url"
								label="Server URL"
								placeholder="https://"
								value={infrastructureMonitor.url}
								onBlur={handleBlur}
								onChange={handleChange}
								error={errors["url"] ? true : false}
								helperText={errors["url"]}
								disabled={true}
							/>
							<TextInput
								type="text"
								id="name"
								label="Display name"
								placeholder="Google"
								isOptional={true}
								value={infrastructureMonitor.name}
								onBlur={handleBlur}
								onChange={handleChange}
								error={errors["name"]}
							/>
							<TextInput
								type="text"
								id="secret"
								label="Authorization secret"
								value={infrastructureMonitor.secret}
								onBlur={handleBlur}
								onChange={handleChange}
								error={errors["secret"] ? true : false}
								helperText={errors["secret"]}
							/>
						</Stack>
					</ConfigBox>
					<ConfigBox>
						<Box>
							<Typography component="h2">Incident notifications</Typography>
							<Typography component="p">
								When there is an incident, notify users.
							</Typography>
						</Box>
						<Stack gap={theme.spacing(6)}>
							<Typography component="p">When there is a new incident,</Typography>
							<Checkbox
								id="notify-email-default"
								label={`Notify via email (to ${user.email})`}
								isChecked={infrastructureMonitor.notifications.some(
									(notification) => notification.type === "email"
								)}
								value={user?.email}
								onChange={(e) => handleChange(e)}
								onBlur={handleBlur}
							/>
						</Stack>
					</ConfigBox>

					<ConfigBox>
						<Box>
							<Typography component="h2">Customize alerts</Typography>
							<Typography component="p">
								Send a notification to user(s) when thresholds exceed a specified
								percentage.
							</Typography>
						</Box>
						<Stack gap={theme.spacing(6)}>
							{HARDWARE_MONITOR_TYPES.map((type, idx) => (
								<CustomThreshold
									key={idx}
									checkboxId={type}
									checkboxLabel={
										type !== "cpu" ? capitalizeFirstLetter(type) : type.toUpperCase()
									}
									onCheckboxChange={handleCustomAlertCheckChange}
									fieldId={THRESHOLD_FIELD_PREFIX + type}
									fieldValue={infrastructureMonitor[THRESHOLD_FIELD_PREFIX + type] ?? ""}
									onFieldChange={handleChange}
									onFieldBlur={handleBlur}
									// TODO: need BE, maybe in another PR
									alertUnit={type == "temperature" ? "°C" : "%"}
									infrastructureMonitor={infrastructureMonitor}
									errors={errors}
								/>
							))}
							{alertErrKeyLen > 0 && (
								<Typography
									component="span"
									className="input-error"
									color={theme.palette.error.main}
									mt={theme.spacing(2)}
									sx={{
										opacity: 0.8,
									}}
								>
									{
										errors[
											THRESHOLD_FIELD_PREFIX +
												HARDWARE_MONITOR_TYPES.filter(
													(type) => errors[THRESHOLD_FIELD_PREFIX + type]
												)[0]
										]
									}
								</Typography>
							)}
						</Stack>
					</ConfigBox>
					<ConfigBox>
						<Box>
							<Typography component="h2">Advanced settings</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<Select
								id="interval"
								label="Check frequency"
								value={infrastructureMonitor.interval || 15}
								onChange={(e) => handleChange(e, "interval")}
								onBlur={(e) => handleBlur(e, "interval")}
								items={frequencies}
							/>
						</Stack>
					</ConfigBox>
					<Stack
						direction="row"
						justifyContent="flex-end"
					>
						<LoadingButton
							variant="contained"
							color="primary"
							onClick={handleCreateInfrastructureMonitor}
							loading={isLoading}
						>
							Create infrastructure monitor
						</LoadingButton>
					</Stack>
				</Stack>
			</Box>
		)
	);
};

export default ConfigureInfrastructureMonitor;

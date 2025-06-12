//Components
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import TextInput from "../../../Components/Inputs/TextInput";
import { HttpAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import ConfigBox from "../../../Components/ConfigBox";
import Radio from "../../../Components/Inputs/Radio";
import Select from "../../../Components/Inputs/Select";
import NotificationsConfig from "../../../Components/NotificationConfig";

// Utils
import { useState } from "react";
import { useSelector } from "react-redux";
import { monitorValidation } from "../../../Validation/validation";
import { parseDomainName } from "../../../Utils/monitorUtils";
import { useTranslation } from "react-i18next";
import { useGetNotificationsByTeamId } from "../../../Hooks/useNotifications";
import { useTheme } from "@emotion/react";
import { createToast } from "../../../Utils/toastUtils";
import { useCreateMonitor } from "../../../Hooks/monitorHooks";

const MS_PER_MINUTE = 60000;

const CRUMBS = [
	{ name: "pagespeed", path: "/pagespeed" },
	{ name: "create", path: `/pagespeed/create` },
];

const SELECT_VALUES = [
	{ _id: 3, name: "3 minutes" },
	{ _id: 5, name: "5 minutes" },
	{ _id: 10, name: "10 minutes" },
	{ _id: 20, name: "20 minutes" },
	{ _id: 60, name: "1 hour" },
	{ _id: 1440, name: "1 day" },
	{ _id: 10080, name: "1 week" },
];

const CreatePageSpeed = () => {
	// State
	const [monitor, setMonitor] = useState({
		url: "",
		name: "",
		type: "pagespeed",
		notifications: [],
		interval: 3,
	});

	const [https, setHttps] = useState(true);
	const [errors, setErrors] = useState({});
	const { user } = useSelector((state) => state.auth);
	const [notifications, notificationsAreLoading, error] = useGetNotificationsByTeamId();

	// Setup
	const theme = useTheme();
	const [createMonitor, isCreating] = useCreateMonitor();

	// Handlers
	const onSubmit = async (event) => {
		event.preventDefault();
		let form = {
			url: `http${https ? "s" : ""}://` + monitor.url,
			name: monitor.name === "" ? monitor.url : monitor.name,
			type: monitor.type,
			interval: monitor.interval * MS_PER_MINUTE,
		};

		const { error } = monitorValidation.validate(form, {
			abortEarly: false,
		});

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
			createToast({ body: "Please check the form for errors." });
			return;
		}

		form = {
			...form,
			description: form.name,
			teamId: user.teamId,
			userId: user._id,
			notifications: monitor.notifications,
		};

		await createMonitor({ monitor: form, redirect: "/pagespeed" });
	};

	const handleChange = (event) => {
		const { value, name } = event.target;
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
		const { name } = event.target;
		if (name === "url") {
			const { value } = event.target;
			if (monitor.name !== "") {
				return;
			}
			setMonitor((prev) => ({
				...prev,
				name: parseDomainName(value),
			}));
		}
	};

	const { t } = useTranslation();

	return (
		<Box
			className="create-monitor"
			sx={{
				"& h1": {
					color: theme.palette.primary.contrastText,
				},
			}}
		>
			<Breadcrumbs list={CRUMBS} />
			<Stack
				component="form"
				className="create-monitor-form"
				onSubmit={onSubmit}
				noValidate
				spellCheck="false"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
			>
				<Typography
					component="h1"
					variant="h1"
				>
					<Typography
						component="span"
						fontSize="inherit"
					>
						{t("createYour")}{" "}
					</Typography>
					<Typography
						component="span"
						fontSize="inherit"
						fontWeight="inherit"
						color={theme.palette.primary.contrastTextSecondary}
					>
						{t("pageSpeedMonitor")}
					</Typography>
				</Typography>
				<ConfigBox>
					<Box>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("settingsGeneralSettings")}
						</Typography>
						<Typography component="p">{t("distributedUptimeCreateSelectURL")}</Typography>
					</Box>
					<Stack gap={theme.spacing(15)}>
						<TextInput
							type={"url"}
							name="url"
							id="monitor-url"
							label="URL to monitor"
							startAdornment={<HttpAdornment https={https} />}
							placeholder="google.com"
							value={monitor.url}
							onChange={handleChange}
							onBlur={handleBlur}
							error={errors["url"] ? true : false}
							helperText={errors["url"]}
						/>
						<TextInput
							type="text"
							id="monitor-name"
							name="name"
							label="Display name"
							isOptional={true}
							placeholder="Google"
							value={monitor.name}
							onChange={handleChange}
							error={errors["name"] ? true : false}
							helperText={errors["name"]}
						/>
					</Stack>
				</ConfigBox>
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
								desc="Use the Lighthouse PageSpeed API to monitor your website"
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
							<Box className="error-container">
								<Typography
									component="p"
									className="input-error"
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
						setMonitor={setMonitor}
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
					<Stack gap={theme.spacing(12)}>
						<Select
							id="monitor-interval"
							name="interval"
							label="Check frequency"
							value={monitor.interval || 3}
							onChange={handleChange}
							items={SELECT_VALUES}
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
						disabled={!Object.values(errors).every((value) => value === undefined)}
						loading={isCreating}
					>
						{t("createMonitor")}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};
export default CreatePageSpeed;

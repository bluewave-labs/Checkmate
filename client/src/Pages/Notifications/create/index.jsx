// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Button from "@mui/material/Button";
import ConfigBox from "../../../Components/ConfigBox";
import Box from "@mui/material/Box";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";

// Utils
import { useState } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useCreateNotification } from "../../../Hooks/useNotifications";
import {
	notificationEmailValidation,
	notificationWebhookValidation,
	notificationPagerDutyValidation,
} from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";

// Setup

const NOTIFICATION_TYPES = [
	{ _id: 1, name: "E-mail", value: "email" },
	{ _id: 2, name: "Slack", value: "webhook" },
	{ _id: 3, name: "PagerDuty", value: "pager_duty" },
];

const CreateNotifications = () => {
	const theme = useTheme();
	const [createNotification, isLoading, error] = useCreateNotification();
	const BREADCRUMBS = [
		{ name: "notifications", path: "/notifications" },
		{ name: "create", path: "/notifications/create" },
	];

	// Redux state
	const { user } = useSelector((state) => state.auth);

	// local state
	const [notification, setNotification] = useState({
		userId: user._id,
		teamId: user.teamId,
		notificationName: "",
		address: "",
		type: NOTIFICATION_TYPES[0]._id,
		config: {
			webhookUrl: "",
			platform: "",
			routingKey: "",
		},
	});
	const [errors, setErrors] = useState({});
	const { t } = useTranslation();

	// handlers
	const onSubmit = (e) => {
		e.preventDefault();
		const form = {
			...notification,
			type: NOTIFICATION_TYPES.find((type) => type._id === notification.type).value,
		};

		if (notification.type === 2) {
			form.type = "webhook";
		}

		let error = null;

		if (form.type === "email") {
			error = notificationEmailValidation.validate(
				{ notificationName: form.notificationName, address: form.address },
				{ abortEarly: false }
			).error;
		} else if (form.type === "webhook") {
			form.config = {
				platform: form.config.platform,
				webhookUrl: form.config.webhookUrl,
			};
			error = notificationWebhookValidation.validate(
				{ notificationName: form.notificationName, config: form.config },
				{ abortEarly: false }
			).error;
		} else if (form.type === "pager_duty") {
			form.config = {
				platform: form.config.platform,
				routingKey: form.config.routingKey,
			};
			error = notificationPagerDutyValidation.validate(
				{ notificationName: form.notificationName, config: form.config },
				{ abortEarly: false }
			).error;
		}

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			createToast({ body: "Please check the form for errors." });
			setErrors(newErrors);
			return;
		}

		createNotification(form);
	};

	const onChange = (e) => {
		const { name, value } = e.target;

		const newNotification = { ...notification, [name]: value };

		// Handle config/platform initialization if type is webhook

		if (newNotification.type === 1) {
			newNotification.config = null;
		} else if (newNotification.type === 2) {
			newNotification.address = "";
			newNotification.config = newNotification.config || {};
			if (name === "config") {
				newNotification.config = value;
			}
			newNotification.config.platform = "slack";
		} else if (newNotification.type === 3) {
			newNotification.config = newNotification.config || {};
			if (name === "config") {
				newNotification.config = value;
			}
			newNotification.config.platform = "pager_duty";
		}

		// Field-level validation
		let fieldError;

		if (name === "notificationName") {
			const { error } = notificationEmailValidation.extract(name).validate(value);
			fieldError = error?.message;
		}

		if (newNotification.type === 1 && name === "address") {
			const { error } = notificationEmailValidation.extract(name).validate(value);
			fieldError = error?.message;
		}

		if (newNotification.type === 2 && name === "config") {
			// Validate only webhookUrl inside config
			const { error } = notificationWebhookValidation.extract("config").validate(value);
			fieldError = error?.message;
		}

		// Set field-level error
		setErrors((prev) => ({
			...prev,
			[name]: fieldError,
		}));

		setNotification(newNotification);
	};

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h1">{t("createNotifications.title")}</Typography>
			<Stack
				component="form"
				onSubmit={onSubmit}
				noValidate
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
			>
				<ConfigBox>
					<Box>
						<Typography component="h2">
							{t("createNotifications.nameSettings.title")}
						</Typography>
						<Typography component="p">
							{t("createNotifications.nameSettings.description")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<TextInput
							label={t("createNotifications.nameSettings.nameLabel")}
							name="notificationName"
							placeholder={t("createNotifications.nameSettings.namePlaceholder")}
							value={notification.notificationName}
							onChange={onChange}
							error={Boolean(errors.notificationName)}
							helperText={errors["notificationName"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">
							{t("createNotifications.typeSettings.title")}
						</Typography>
						<Typography component="p">
							{t("createNotifications.typeSettings.description")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Select
							items={NOTIFICATION_TYPES}
							label="Type"
							name="type"
							value={notification.type}
							onChange={onChange}
						/>
					</Stack>
				</ConfigBox>
				{notification.type === 1 && (
					<ConfigBox>
						<Box>
							<Typography component="h2">
								{t("createNotifications.emailSettings.title")}
							</Typography>
							<Typography component="p">
								{t("createNotifications.emailSettings.description")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<TextInput
								label={t("createNotifications.emailSettings.emailLabel")}
								name="address"
								placeholder={t("createNotifications.emailSettings.emailPlaceholder")}
								value={notification.address}
								onChange={onChange}
								error={Boolean(errors.address)}
								helperText={errors["address"]}
							/>
						</Stack>
					</ConfigBox>
				)}
				{notification.type === 2 && (
					<ConfigBox>
						<Box>
							<Typography component="h2">
								{t("createNotifications.slackSettings.title")}
							</Typography>
							<Typography component="p">
								{t("createNotifications.slackSettings.description")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<TextInput
								label={t("createNotifications.slackSettings.webhookLabel")}
								value={notification.config.webhookUrl}
								error={Boolean(errors.config)}
								helperText={errors["config"]}
								onChange={(e) => {
									const updatedConfig = {
										...notification.config,
										webhookUrl: e.target.value,
									};

									onChange({
										target: {
											name: "config",
											value: updatedConfig,
										},
									});
								}}
							/>
						</Stack>
					</ConfigBox>
				)}
				{notification.type === 3 && (
					<ConfigBox>
						<Box>
							<Typography component="h2">
								{t("createNotifications.pagerdutySettings.title")}
							</Typography>
							<Typography component="p">
								{t("createNotifications.pagerdutySettings.description")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<TextInput
								label={t("createNotifications.pagerdutySettings.integrationKeyLabel")}
								placeholder={t(
									"createNotifications.pagerdutySettings.integrationKeyPlaceholder"
								)}
								value={notification.config.routingKey}
								error={Boolean(errors.config)}
								helperText={errors["config"]}
								onChange={(e) => {
									const updatedConfig = {
										...notification.config,
										routingKey: e.target.value,
									};

									onChange({
										target: {
											name: "config",
											value: updatedConfig,
										},
									});
								}}
							/>
						</Stack>
					</ConfigBox>
				)}
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						loading={isLoading}
						type="submit"
						variant="contained"
						color="accent"
					>
						Submit
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default CreateNotifications;

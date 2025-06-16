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
import { useTheme } from "@emotion/react";
import {
	useCreateNotification,
	useGetNotificationById,
	useEditNotification,
	useTestNotification,
} from "../../../Hooks/useNotifications";
import {
	notificationEmailValidation,
	notificationWebhookValidation,
	notificationPagerDutyValidation,
} from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { NOTIFICATION_TYPES } from "../utils";

// Setup

const CreateNotifications = () => {
	const { notificationId } = useParams();
	const theme = useTheme();
	const [createNotification, isCreating, createNotificationError] =
		useCreateNotification();
	const [editNotification, isEditing, editNotificationError] = useEditNotification();
	const [testNotification, isTesting, testNotificationError] = useTestNotification();

	const BREADCRUMBS = [
		{ name: "notifications", path: "/notifications" },
		{ name: "create", path: "/notifications/create" },
	];

	// Redux state

	// local state
	const [notification, setNotification] = useState({
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

	const [notificationIsLoading, getNotificationError] = useGetNotificationById(
		notificationId,
		setNotification
	);

	// handlers
	const onSubmit = (e) => {
		e.preventDefault();
		const form = {
			...notification,
			type: NOTIFICATION_TYPES.find((type) => type._id === notification.type).value,
		};

		if (form.type === "slack" || form.type === "discord") {
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

		if (notificationId) {
			editNotification(notificationId, form);
		} else {
			createNotification(form);
		}
	};

	const onChange = (e) => {
		const { name, value } = e.target;

		const newNotification = { ...notification, [name]: value };

		// Handle config/platform initialization if type is webhook

		const type = NOTIFICATION_TYPES.find(
			(type) => type._id === newNotification.type
		).value;

		if (type === "email") {
			newNotification.config = null;
		} else if (type === "slack" || type === "webhook" || type === "discord") {
			newNotification.address = "";
			newNotification.config = newNotification.config || {};
			if (name === "config") {
				newNotification.config = value;
			}
			if (type === "webhook") {
				newNotification.config.platform = "webhook";
			}
			if (type === "slack") {
				newNotification.config.platform = "slack";
			}
			if (type === "discord") {
				newNotification.config.platform = "discord";
			}
		} else if (type === "pager_duty") {
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

		if (type === "email" && name === "address") {
			const { error } = notificationEmailValidation.extract(name).validate(value);
			fieldError = error?.message;
		}

		if (
			(type === "slack" || type === "webhook" || type === "discord") &&
			name === "config"
		) {
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

	const onTestNotification = () => {
		const form = {
			...notification,
			type: NOTIFICATION_TYPES.find((type) => type._id === notification.type).value,
		};

		if (form.type === "slack" || form.type === "discord") {
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

		testNotification(form);
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
								value={notification.config.webhookUrl || ""}
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
								value={notification.config.routingKey || ""}
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
				{notification.type === 4 && (
					<ConfigBox>
						<Box>
							<Typography component="h2">
								{t("createNotifications.genericWebhookSettings.title")}
							</Typography>
							<Typography component="p">
								{t("createNotifications.genericWebhookSettings.description")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<TextInput
								label={t("createNotifications.genericWebhookSettings.webhookLabel")}
								value={notification.config.webhookUrl || ""}
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
				{notification.type === 5 && (
					<ConfigBox>
						<Box>
							<Typography component="h2">
								{t("createNotifications.discordSettings.title")}
							</Typography>
							<Typography component="p">
								{t("createNotifications.discordSettings.description")}
							</Typography>
						</Box>
						<Stack gap={theme.spacing(12)}>
							<TextInput
								label={t("createNotifications.discordSettings.webhookLabel")}
								value={notification.config.webhookUrl || ""}
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
				<Stack
					direction="row"
					justifyContent="flex-end"
					spacing={theme.spacing(2)}
				>
					<Button
						loading={isCreating || isEditing || notificationIsLoading}
						variant="contained"
						color="secondary"
						onClick={onTestNotification}
					>
						Test notification
					</Button>
					<Button
						loading={isCreating || isEditing || notificationIsLoading}
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

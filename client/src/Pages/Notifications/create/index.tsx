import { BasePage, ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useGet, usePost, usePatch } from "@/Hooks/UseApi";
import { useNotificationForm } from "@/Hooks/useNotificationForm";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";
import { useTranslation } from "react-i18next";
import { NotificationChannels } from "@/Types/Notification";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormSelectField } from "@/Components/inputs/forms/FormSelectField";
import { CredentialField } from "./CredentialField";

const NotificationsCreatePage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const { notificationId } = useParams<{ notificationId: string }>();
	const isEditMode = Boolean(notificationId);

	const { data: existingNotification } = useGet<Notification>(
		isEditMode ? `/notifications/${notificationId}` : null
	);

	const { post, loading: isSubmitting } = usePost<NotificationFormData, Notification>();
	const { patch, loading: isPatching } = usePatch<NotificationFormData, Notification>();
	const { post: testPost, loading: isTesting } = usePost<NotificationFormData, void>();

	const [credentialHasBeenReset, setCredentialHasBeenReset] = useState(false);

	const { resolver, defaults, isCredentialKept } = useNotificationForm({
		data: existingNotification,
		isCredentialReset: credentialHasBeenReset,
	});

	const form = useForm<NotificationFormData>({
		resolver,
		defaultValues: defaults,
	});

	const { watch, reset, handleSubmit, clearErrors, trigger, getValues, setValue } = form;

	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	const watchedType = watch("type");
	const previousType = useRef(watchedType);

	useEffect(() => {
		clearErrors();

		if (previousType.current === watchedType) return;
		previousType.current = watchedType;

		// A credential belongs to the provider it was issued by. The field is shared across providers,
		// and react-hook-form keeps a value when its input unmounts, so without this the credential
		// typed for one provider silently becomes the next one's, hidden behind a masked field.
		setValue("accessToken", "");
		setCredentialHasBeenReset(false);
	}, [watchedType, clearErrors, setValue]);

	const addressConfig = useMemo(() => {
		if (watchedType === "pager_duty") {
			return {
				title: t("pages.notifications.form.pagerDuty.title"),
				description: t("pages.notifications.form.pagerDuty.description"),
				fieldLabel: t("pages.notifications.form.pagerDuty.optionIntegrationKey"),
				placeholder: t("pages.notifications.form.pagerDuty.placeholder"),
			};
		}
		if (watchedType === "email") {
			return {
				title: t("pages.notifications.form.address.title"),
				description: t("pages.notifications.form.address.description"),
				fieldLabel: t("pages.notifications.form.address.optionAddress"),
				placeholder: t("pages.notifications.form.address.placeholderEmail"),
			};
		}
		return {
			title: t("pages.notifications.form.address.title"),
			description: t("pages.notifications.form.address.description"),
			fieldLabel: t("pages.notifications.form.address.optionAddress"),
			placeholder: t("pages.notifications.form.address.placeholderWebhook"),
		};
	}, [watchedType, t]);

	// A credential the user has not chosen to replace is left out of the payload entirely, which the
	// server reads as "keep the stored value".
	const buildPayload = (data: NotificationFormData): NotificationFormData => {
		if (!isCredentialKept(data.type)) {
			return data;
		}
		const payload = { ...data };
		Reflect.deleteProperty(payload, "accessToken");
		return payload;
	};

	const onSubmit = async (data: NotificationFormData) => {
		const payload = buildPayload(data);
		const result = isEditMode
			? await patch(`/notifications/${notificationId}`, payload)
			: await post("/notifications", payload);
		if (result) {
			navigate("/notifications");
		}
	};

	const handleTest = async () => {
		const isValid = await trigger();
		if (!isValid) return;
		const payload = buildPayload(getValues());
		// Testing a saved channel goes through its own endpoint so the server can supply the stored
		// credential. Anything else — an unsaved channel, or one being switched to another provider,
		// whose stored credential no longer applies — carries what it needs in the body.
		const isSavedChannel = isEditMode && watchedType === existingNotification?.type;
		const endpoint = isSavedChannel
			? `/notifications/${notificationId}/test`
			: "/notifications/test";
		await testPost(endpoint, payload);
	};

	const handleCredentialReset = () => {
		setCredentialHasBeenReset(true);
	};

	return (
		<FormProvider {...form}>
			<BasePage
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<ConfigBox
					title={t("pages.notifications.form.notificationName.title")}
					subtitle={t("pages.notifications.form.notificationName.description")}
					rightContent={
						<FormTextField
							name="notificationName"
							fieldLabel={t("pages.notifications.form.notificationName.optionName")}
							placeholder={t("pages.notifications.form.notificationName.placeholder")}
						/>
					}
				/>
				<ConfigBox
					title={t("pages.notifications.form.type.title")}
					subtitle={t("pages.notifications.form.type.description")}
					rightContent={
						<FormSelectField
							name="type"
							fieldLabel={t("pages.notifications.form.type.optionType")}
							options={NotificationChannels.map((channel) => ({
								value: channel,
								label: t(`pages.notifications.form.type.value.${channel}`),
							}))}
						/>
					}
				/>
				{watchedType !== "matrix" &&
					watchedType !== "telegram" &&
					watchedType !== "pushover" &&
					watchedType !== "twilio" &&
					watchedType !== "ntfy" && (
						<ConfigBox
							title={addressConfig.title}
							subtitle={addressConfig.description}
							rightContent={
								<FormTextField
									name="address"
									fieldLabel={addressConfig.fieldLabel}
									placeholder={addressConfig.placeholder}
								/>
							}
						/>
					)}
				{watchedType === "ntfy" && (
					<ConfigBox
						title={t("pages.notifications.form.ntfy.title")}
						subtitle={t("pages.notifications.form.ntfy.description")}
						rightContent={
							<Stack spacing={theme.spacing(8)}>
								<FormTextField
									name="address"
									fieldLabel={t("pages.notifications.form.ntfy.optionServerUrl")}
									placeholder={t("pages.notifications.form.ntfy.placeholderServerUrl")}
								/>
								<FormTextField
									name="topic"
									fieldLabel={t("pages.notifications.form.ntfy.optionTopic")}
									placeholder={t("pages.notifications.form.ntfy.placeholderTopic")}
								/>
							</Stack>
						}
					/>
				)}
				{watchedType === "telegram" && (
					<ConfigBox
						title={t("pages.notifications.form.telegram.title")}
						subtitle={t("pages.notifications.form.telegram.description")}
						rightContent={
							<Stack spacing={theme.spacing(8)}>
								<CredentialField
									fieldLabel={t("pages.notifications.form.telegram.optionBotToken")}
									placeholder={t("pages.notifications.form.telegram.placeholderBotToken")}
									storedLabel={t("pages.notifications.form.credential.labelSet")}
									resetLabel={t("common.buttons.reset")}
									isEditable={!isCredentialKept(watchedType)}
									onReset={handleCredentialReset}
								/>
								<FormTextField
									name="address"
									fieldLabel={t("pages.notifications.form.telegram.optionChatId")}
									placeholder={t("pages.notifications.form.telegram.placeholderChatId")}
								/>
							</Stack>
						}
					/>
				)}
				{watchedType === "pushover" && (
					<ConfigBox
						title={t("pages.notifications.form.pushover.title")}
						subtitle={t("pages.notifications.form.pushover.description")}
						rightContent={
							<Stack spacing={theme.spacing(8)}>
								<CredentialField
									fieldLabel={t("pages.notifications.form.pushover.optionAppToken")}
									placeholder={t("pages.notifications.form.pushover.placeholderAppToken")}
									storedLabel={t("pages.notifications.form.credential.labelSet")}
									resetLabel={t("common.buttons.reset")}
									isEditable={!isCredentialKept(watchedType)}
									onReset={handleCredentialReset}
								/>

								<FormTextField
									name="address"
									fieldLabel={t("pages.notifications.form.pushover.optionUserKey")}
									placeholder={t("pages.notifications.form.pushover.placeholderUserKey")}
								/>
							</Stack>
						}
					/>
				)}
				{watchedType === "twilio" && (
					<ConfigBox
						title={t("pages.notifications.form.twilio.title")}
						subtitle={t("pages.notifications.form.twilio.description")}
						rightContent={
							<Stack spacing={theme.spacing(8)}>
								<FormTextField
									name="accountSid"
									fieldLabel={t("pages.notifications.form.twilio.optionAccountSid")}
									placeholder={t("pages.notifications.form.twilio.placeholderAccountSid")}
								/>
								<CredentialField
									fieldLabel={t("pages.notifications.form.twilio.optionAuthToken")}
									placeholder={t("pages.notifications.form.twilio.placeholderAuthToken")}
									storedLabel={t("pages.notifications.form.credential.labelSet")}
									resetLabel={t("common.buttons.reset")}
									isEditable={!isCredentialKept(watchedType)}
									onReset={handleCredentialReset}
								/>

								<FormTextField
									name="twilioPhoneNumber"
									fieldLabel={t("pages.notifications.form.twilio.optionFromNumber")}
									placeholder={t("pages.notifications.form.twilio.placeholderFromNumber")}
								/>

								<FormTextField
									name="phone"
									fieldLabel={t("pages.notifications.form.twilio.optionToNumber")}
									placeholder={t("pages.notifications.form.twilio.placeholderToNumber")}
								/>
							</Stack>
						}
					/>
				)}
				{watchedType === "matrix" && (
					<ConfigBox
						title={t("pages.notifications.form.matrix.title")}
						subtitle={t("pages.notifications.form.matrix.description")}
						rightContent={
							<Stack spacing={theme.spacing(8)}>
								<FormTextField
									name="homeserverUrl"
									fieldLabel={t("pages.notifications.form.homeServer.optionHomeServer")}
									placeholder={t("pages.notifications.form.homeServer.placeholder")}
								/>
								<FormTextField
									name="roomId"
									fieldLabel={t("pages.notifications.form.roomId.optionRoomId")}
									placeholder={t("pages.notifications.form.roomId.placeholder")}
								/>
								<CredentialField
									fieldLabel={t("pages.notifications.form.accessToken.optionAccessToken")}
									placeholder={t("pages.notifications.form.accessToken.placeholder")}
									storedLabel={t("pages.notifications.form.credential.labelSet")}
									resetLabel={t("common.buttons.reset")}
									isEditable={!isCredentialKept(watchedType)}
									onReset={handleCredentialReset}
								/>
							</Stack>
						}
					/>
				)}
				<Stack
					direction="row"
					justifyContent="flex-end"
					spacing={theme.spacing(2)}
				>
					<Button
						variant="contained"
						color="primary"
						onClick={handleTest}
						loading={isTesting}
					>
						{t("common.buttons.test")}
					</Button>
					<Button
						loading={isSubmitting || isPatching}
						type="submit"
						variant="contained"
						color="primary"
					>
						{t("common.buttons.save")}
					</Button>
				</Stack>
			</BasePage>
		</FormProvider>
	);
};

export default NotificationsCreatePage;

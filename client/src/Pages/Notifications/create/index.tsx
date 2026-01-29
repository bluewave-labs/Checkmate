import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import { TextField, Select } from "@/Components/v2/inputs";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGet } from "@/Hooks/UseApi";
import { useNotificationForm } from "@/Hooks/useNotificationForm";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";
import { useTranslation } from "react-i18next";
import { NotificationChannels } from "@/Types/Notification";

const NotificationsCreatePage = () => {
	const { t } = useTranslation();
	const { notificationId } = useParams<{ notificationId: string }>();
	const isEditMode = Boolean(notificationId);

	const { data: existingNotification } = useGet<Notification>(
		isEditMode ? `/notifications/${notificationId}` : null
	);

	const { schema, defaults } = useNotificationForm({ data: existingNotification });

	const form = useForm<NotificationFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const {
		register,
		control,
		watch,
		reset,
		formState: {},
	} = form;

	// Reset form when defaults change (i.e., when data is fetched)
	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	const watchedType = watch("type");

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


	// Suppress unused variable warnings - these will be used when UI is built
	void register;
	void control;

	return (
		<BasePage>
			<ConfigBox
				title={t("pages.notifications.form.notificationName.title")}
				subtitle={t("pages.notifications.form.notificationName.description")}
				rightContent={
					<Controller
						name="notificationName"
						control={control}
						defaultValue={defaults.notificationName}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								type="text"
								fieldLabel={t("pages.notifications.form.notificationName.optionName")}
								placeholder={t("pages.notifications.form.notificationName.placeholder")}
								fullWidth
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
							/>
						)}
					/>
				}
			/>
			<ConfigBox
				title={t("pages.notifications.form.type.title")}
				subtitle={t("pages.notifications.form.type.description")}
				rightContent={
					<Controller
						name="type"
						control={control}
						defaultValue={defaults.type}
						render={({ field, fieldState }) => {
							return (
								<Select
									value={field.value}
									fieldLabel={t("pages.notifications.form.type.optionType")}
									error={!!fieldState.error}
									onChange={field.onChange}
								>
									{NotificationChannels.map((type: string) => {
										return (
											<MenuItem
												key={type}
												value={type}
											>
												<Typography textTransform={"capitalize"}>{type}</Typography>
											</MenuItem>
										);
									})}
								</Select>
							);
						}}
					/>
				}
			/>
			{watchedType !== "matrix" && (
				<ConfigBox
					title={addressConfig.title}
					subtitle={addressConfig.description}
					rightContent={
						<Controller
							name="address"
							control={control}
							defaultValue={defaults.address}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={addressConfig.fieldLabel}
									placeholder={addressConfig.placeholder}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
					}
				/>
			)}
			{watchedType === "matrix" && (
				<ConfigBox
					title={t("pages.notifications.form.homeServer.title")}
					subtitle={t("pages.notifications.form.homeServer.description")}
					rightContent={
						<Controller
							name="homeserverUrl"
							control={control}
							defaultValue={defaults.homeserverUrl}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={t("pages.notifications.form.homeServer.optionHomeServer")}
									placeholder={t("pages.notifications.form.homeServer.placeholder")}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
					}
				/>
			)}
			{watchedType === "matrix" && (
				<ConfigBox
					title={t("pages.notifications.form.roomId.title")}
					subtitle={t("pages.notifications.form.roomId.description")}
					rightContent={
						<Controller
							name="roomId"
							control={control}
							defaultValue={defaults.roomId}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={t("pages.notifications.form.roomId.optionRoomId")}
									placeholder={t("pages.notifications.form.roomId.placeholder")}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
					}
				/>
			)}
			{watchedType === "matrix" && (
				<ConfigBox
					title={t("pages.notifications.form.accessToken.title")}
					subtitle={t("pages.notifications.form.accessToken.description")}
					rightContent={
						<Controller
							name="accessToken"
							control={control}
							defaultValue={defaults.accessToken}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="text"
									fieldLabel={t("pages.notifications.form.accessToken.optionAccessToken")}
									placeholder={t("pages.notifications.form.accessToken.placeholder")}
									fullWidth
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
					}
				/>
			)}
		</BasePage>
	);
};

export default NotificationsCreatePage;

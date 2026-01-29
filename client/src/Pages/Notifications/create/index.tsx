import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import { TextField } from "@/Components/v2/inputs";

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGet } from "@/Hooks/UseApi";
import { useNotificationForm } from "@/Hooks/useNotificationForm";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";
import { useTranslation } from "react-i18next";

const NotificationsCreatePage = () => {
	const { t } = useTranslation();
	const { notificationId } = useParams<{ notificationId: string }>();
	const isEditMode = Boolean(notificationId);

	const { data: existingNotification, isLoading: notificationIsLoading } =
		useGet<Notification>(isEditMode ? `/notifications/${notificationId}` : null);

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
		formState: { errors },
	} = form;

	// Reset form when defaults change (i.e., when data is fetched)
	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	const watchedType = watch("type");

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
						render={({ field }) => (
							<TextField
								{...field}
								type="text"
								fieldLabel={t("pages.notifications.form.notificationName.optionName")}
								placeholder={t("pages.notifications.form.notificationName.placeholder")}
								fullWidth
								error={!!errors.notificationName}
								helperText={
									errors.notificationName ? errors.notificationName.message : ""
								}
							/>
						)}
					/>
				}
			/>
		</BasePage>
	);
};

export default NotificationsCreatePage;

import { Stack } from "@mui/material";
import { ConfigBox } from "@/Components/v2/design-elements";
import { TextField, Button } from "@/Components/v2/inputs";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { usePasswordForm } from "@/Hooks/usePasswordForm";
import type { PasswordFormData } from "@/Validation/password";

export const TabPassword = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { resolver, defaults } = usePasswordForm();

	const { control, handleSubmit } = useForm<PasswordFormData>({
		resolver,
		defaultValues: defaults,
	});

	const onSubmit = (data: PasswordFormData) => {
		console.log("Password form data:", data);
	};

	return (
		<Stack
			gap={theme.spacing(8)}
			component="form"
			onSubmit={handleSubmit(onSubmit)}
		>
			<ConfigBox
				title={t("pages.account.form.currentPassword.title")}
				subtitle={t("pages.account.form.currentPassword.description")}
				rightContent={
					<Controller
						name="currentPassword"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								type="password"
								fieldLabel={t("pages.account.form.currentPassword.option.label")}
								placeholder={t("pages.account.form.currentPassword.option.placeholder")}
								autoComplete="current-password"
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
							/>
						)}
					/>
				}
			/>
			<ConfigBox
				title={t("pages.account.form.newPassword.title")}
				subtitle={t("pages.account.form.newPassword.description")}
				rightContent={
					<Stack gap={theme.spacing(8)}>
						<Controller
							name="newPassword"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="password"
									fieldLabel={t(
										"pages.account.form.newPassword.option.newPassword.label"
									)}
									placeholder={t(
										"pages.account.form.newPassword.option.newPassword.placeholder"
									)}
									autoComplete="new-password"
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
						<Controller
							name="confirm"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									type="password"
									fieldLabel={t("pages.account.form.newPassword.option.confirm.label")}
									placeholder={t(
										"pages.account.form.newPassword.option.confirm.placeholder"
									)}
									autoComplete="new-password"
									error={!!fieldState.error}
									helperText={fieldState.error?.message ?? ""}
								/>
							)}
						/>
					</Stack>
				}
			/>
			<Button
				type="submit"
				variant="contained"
				color="primary"
				sx={{ alignSelf: "flex-end", minWidth: 100 }}
			>
				{t("common.buttons.save")}
			</Button>
		</Stack>
	);
};

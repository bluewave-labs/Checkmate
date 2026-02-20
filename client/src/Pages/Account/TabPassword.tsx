import { Stack } from "@mui/material";
import { ConfigBox } from "@/Components/design-elements";
import { TextField, Button } from "@/Components/inputs";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { usePasswordForm } from "@/Hooks/usePasswordForm";
import { usePatch } from "@/Hooks/UseApi";
import type { PasswordFormData } from "@/Validation/password";

export const TabPassword = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { resolver, defaults } = usePasswordForm();
	const { patch, loading } = usePatch<FormData, void>();

	const { control, handleSubmit, reset } = useForm<PasswordFormData>({
		resolver,
		defaultValues: defaults,
	});

	const onSubmit = async (data: PasswordFormData) => {
		const fd = new FormData();
		fd.append("password", data.currentPassword);
		fd.append("newPassword", data.newPassword);

		const result = await patch("/auth/user", fd);
		if (result?.success) {
			reset();
		}
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
				loading={loading}
				sx={{ alignSelf: "flex-end", minWidth: 100 }}
			>
				{t("common.buttons.save")}
			</Button>
		</Stack>
	);
};

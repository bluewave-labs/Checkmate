import { Stack } from "@mui/material";
import { ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { usePasswordForm } from "@/Hooks/usePasswordForm";
import { usePatch } from "@/Hooks/UseApi";
import type { PasswordFormData } from "@/Validation/password";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { LAYOUT } from "@/Utils/Theme/constants";

export const TabPassword = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { resolver, defaults } = usePasswordForm();
	const { patch, loading } = usePatch<FormData, void>();

	const form = useForm<PasswordFormData>({
		resolver,
		defaultValues: defaults,
	});
	const { handleSubmit, reset } = form;

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
		<FormProvider {...form}>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<ConfigBox
					title={t("pages.account.form.currentPassword.title")}
					subtitle={t("pages.account.form.currentPassword.description")}
					rightContent={
						<FormTextField
							name="currentPassword"
							type="password"
							autoComplete="current-password"
							fieldLabel={t("pages.account.form.currentPassword.option.label")}
							placeholder={t("pages.account.form.currentPassword.option.placeholder")}
						/>
					}
				/>
				<ConfigBox
					title={t("pages.account.form.newPassword.title")}
					subtitle={t("pages.account.form.newPassword.description")}
					rightContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							<FormTextField
								name="newPassword"
								type="password"
								autoComplete="new-password"
								fieldLabel={t("pages.account.form.newPassword.option.newPassword.label")}
								placeholder={t(
									"pages.account.form.newPassword.option.newPassword.placeholder"
								)}
							/>
							<FormTextField
								name="confirm"
								type="password"
								autoComplete="new-password"
								fieldLabel={t("pages.account.form.newPassword.option.confirm.label")}
								placeholder={t(
									"pages.account.form.newPassword.option.confirm.placeholder"
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
		</FormProvider>
	);
};

import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { usePatch } from "@/Hooks/UseApi";
import { setPasswordSchema, type SetPasswordFormData } from "@/Validation/password";
import { LAYOUT } from "@/Utils/Theme/constants";

interface SetPasswordBoxProps {
	userId: string;
}

// Rendered inside the page's edit form, so it can't be a nested <form>: the button
// submits through react-hook-form and Enter is routed to it instead of the outer form.
export const SetPasswordBox = ({ userId }: SetPasswordBoxProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { patch, loading } = usePatch<SetPasswordFormData, void>();

	const form = useForm<SetPasswordFormData>({
		resolver: zodResolver(setPasswordSchema),
		defaultValues: { password: "" },
	});
	const { handleSubmit, reset } = form;

	const onSubmit = async (data: SetPasswordFormData) => {
		const result = await patch(`/auth/users/${userId}/password`, data);
		if (result?.success) {
			reset();
		}
	};

	return (
		<FormProvider {...form}>
			<ConfigBox
				title={t("pages.account.form.setPassword.title")}
				subtitle={t("pages.account.form.setPassword.description")}
				rightContent={
					<Stack
						gap={theme.spacing(LAYOUT.MD)}
						alignItems="flex-start"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								void handleSubmit(onSubmit)();
							}
						}}
					>
						<FormTextField
							name="password"
							type="password"
							autoComplete="new-password"
							fieldLabel={t("pages.account.form.setPassword.option.label")}
							placeholder={t("pages.account.form.setPassword.option.placeholder")}
						/>
						<Button
							type="button"
							variant="contained"
							color="primary"
							loading={loading}
							onClick={handleSubmit(onSubmit)}
						>
							{t("pages.account.form.setPassword.button")}
						</Button>
					</Stack>
				}
			/>
		</FormProvider>
	);
};

import { BaseAuthPage, TextLink } from "@/Components/v2/design-elements";
import { Button, TextField } from "@/Components/v2/inputs";
import { useTranslation } from "react-i18next";

const SetNewPasswordPage = () => {
	const { t } = useTranslation();
	return (
		<BaseAuthPage
			title={t("pages.auth.setNewPassword.title")}
			subtitle={t("pages.auth.setNewPassword.subtitle")}
		>
			<TextField
				type="password"
				fieldLabel={t("pages.auth.common.form.option.password.label")}
				placeholder={t("pages.auth.common.form.option.password.placeholder")}
			/>
			<TextField
				type="password"
				fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
				placeholder={t("pages.auth.common.form.option.password.placeholder")}
			/>
			<Button
				variant="contained"
				type="submit"
				fullWidth
			>
				{t("auth.forgotPassword.buttons.resetPassword")}
			</Button>
			<TextLink
				alignSelf="center"
				text={t("pages.auth.forgotPassword.links.login.text")}
				linkText={t("pages.auth.forgotPassword.links.login.linkText")}
				href="/login"
			/>
		</BaseAuthPage>
	);
};

export default SetNewPasswordPage;

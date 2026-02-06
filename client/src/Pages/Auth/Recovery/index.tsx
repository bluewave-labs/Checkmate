import { Button, TextField } from "@/Components/v2/inputs";
import { BaseAuthPage, TextLink } from "@/Components/v2/design-elements";

import { useTranslation } from "react-i18next";
const ForgotPasswordPage = () => {
	const { t } = useTranslation();
	return (
		<BaseAuthPage
			component="form"
			title={t("pages.auth.forgotPassword.title")}
			subtitle={t("pages.auth.forgotPassword.subtitle")}
		>
			<TextField
				fieldLabel={t("pages.auth.common.form.option.email.label")}
				placeholder={t("pages.auth.common.form.option.email.placeholder")}
			/>
			<Button
				variant="contained"
				type="submit"
			>
				{t("pages.auth.forgotPassword.submit")}
			</Button>
			<TextLink
				alignSelf={"center"}
				text={t("pages.auth.forgotPassword.links.login.text")}
				linkText={t("pages.auth.forgotPassword.links.login.linkText")}
				href={"/login"}
			/>
		</BaseAuthPage>
	);
};

export default ForgotPasswordPage;

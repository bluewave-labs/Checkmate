import { BaseAuthPage } from "@/Components/v2/design-elements";
import { Button, TextField } from "@/Components/v2/inputs";

import { useTranslation } from "react-i18next";
const RegisterPage = () => {
	const { t } = useTranslation();
	return (
		<BaseAuthPage
			component="form"
			title={t("pages.auth.register.title")}
			subtitle={t("pages.auth.register.subtitle")}
		>
			<TextField
				fieldLabel={t("pages.auth.register.form.option.name.label")}
				placeholder={t("pages.auth.register.form.option.name.placeholder")}
			/>
			<TextField
				fieldLabel={t("pages.auth.register.form.option.surname.label")}
				placeholder={t("pages.auth.register.form.option.surname.placeholder")}
			/>
			<TextField
				fieldLabel={t("pages.auth.common.form.option.email.label")}
				placeholder={t("pages.auth.common.form.option.email.placeholder")}
			/>
			<TextField
				fieldLabel={t("pages.auth.common.form.option.password.label")}
				placeholder={t("pages.auth.common.form.option.password.placeholder")}
			/>
			<TextField
				fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
				placeholder={t("pages.auth.common.form.option.password.placeholder")}
			/>
			<Button
				variant="contained"
				type="submit"
			>
				{t("pages.auth.register.submit")}
			</Button>
		</BaseAuthPage>
	);
};

export default RegisterPage;

import { BaseAuthPage } from "@/Components/v2/design-elements";

import { useTranslation } from "react-i18next";
const LoginPage = () => {
	const { t } = useTranslation();
	return (
		<BaseAuthPage
			title={t("pages.auth.login.title")}
			subtitle={t("pages.auth.login.subtitle")}
		></BaseAuthPage>
	);
};

export default LoginPage;

import { Stack } from "@mui/material";
import { ConfigBox } from "@/Components/v2/design-elements";
import { TextField } from "@/Components/v2/inputs";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";

export const TabPassword = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<Stack gap={theme.spacing(8)}>
			<ConfigBox
				title={t("pages.account.form.currentPassword.title")}
				subtitle={t("pages.account.form.currentPassword.description")}
				rightContent={
					<TextField
						type="password"
						fieldLabel={t("pages.account.form.currentPassword.option.label")}
						placeholder={t("pages.account.form.currentPassword.option.placeholder")}
					/>
				}
			/>
			<ConfigBox
				title={t("pages.account.form.newPassword.title")}
				subtitle={t("pages.account.form.newPassword.description")}
				rightContent={
					<Stack gap={theme.spacing(8)}>
						<TextField
							type="password"
							fieldLabel={t("pages.account.form.newPassword.option.newPassword.label")}
							placeholder={t(
								"pages.account.form.newPassword.option.newPassword.placeholder"
							)}
						/>
						<TextField
							type="password"
							fieldLabel={t("pages.account.form.newPassword.option.confirm.label")}
							placeholder={t("pages.account.form.newPassword.option.confirm.placeholder")}
						/>
					</Stack>
				}
			/>
		</Stack>
	);
};

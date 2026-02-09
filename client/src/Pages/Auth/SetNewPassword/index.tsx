import {
	BaseAuthPage,
	BulletPointCheck,
	TextLink,
} from "@/Components/v2/design-elements";
import { Button, TextField } from "@/Components/v2/inputs";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const SetNewPasswordPage = () => {
	const theme = useTheme();
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
			<Stack gap={theme.spacing(4)}>
				<BulletPointCheck
					text={t("auth.common.passwordRules.length")}
					variant="info"
				/>
				<BulletPointCheck
					text={t("auth.common.passwordRules.special")}
					variant="info"
				/>
				<BulletPointCheck
					text={t("auth.common.passwordRules.number")}
					variant="info"
				/>
				<BulletPointCheck
					text={t("auth.common.passwordRules.uppercase")}
					variant="info"
				/>
				<BulletPointCheck
					text={t("auth.common.passwordRules.lowercase")}
					variant="info"
				/>
				<BulletPointCheck
					text={t("auth.common.passwordRules.match")}
					variant="info"
				/>
			</Stack>
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

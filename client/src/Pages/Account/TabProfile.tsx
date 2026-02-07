import { Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/v2/design-elements";
import { TextField, Button } from "@/Components/v2/inputs";
import { ImageUpload } from "@/Components/v2/inputs";

export const TabProfile = () => {
	const { t } = useTranslation();

	return (
		<Stack gap={4}>
			<ConfigBox
				title={t("pages.account.form.name.title")}
				subtitle={t("pages.account.form.name.description")}
				rightContent={
					<Stack gap={3}>
						<TextField
							fieldLabel={t("pages.account.form.name.option.firstName.label")}
							placeholder={t("pages.account.form.name.option.firstName.placeholder")}
							autoComplete="given-name"
						/>
						<TextField
							fieldLabel={t("pages.account.form.name.option.lastName.label")}
							placeholder={t("pages.account.form.name.option.lastName.placeholder")}
							autoComplete="family-name"
						/>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.account.form.photo.title")}
				subtitle={t("pages.account.form.photo.description")}
				rightContent={<ImageUpload />}
			/>
			<Button
				variant="contained"
				color="primary"
				sx={{ alignSelf: "flex-end" }}
			>
				{t("common.buttons.save")}
			</Button>
		</Stack>
	);
};

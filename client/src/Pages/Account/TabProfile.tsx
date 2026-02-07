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
				title={t("pages.account.profile.name.title")}
				subtitle={t("pages.account.profile.name.subtitle")}
				rightContent={
					<Stack gap={3}>
						<TextField
							fieldLabel={t("pages.account.profile.name.firstName")}
							placeholder={t("pages.account.profile.name.firstNamePlaceholder")}
							autoComplete="given-name"
						/>
						<TextField
							fieldLabel={t("pages.account.profile.name.lastName")}
							placeholder={t("pages.account.profile.name.lastNamePlaceholder")}
							autoComplete="family-name"
						/>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.account.profile.photo.title")}
				subtitle={t("pages.account.profile.photo.subtitle")}
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

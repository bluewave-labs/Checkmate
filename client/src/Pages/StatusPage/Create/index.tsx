import { BasePage, ConfigBox } from "@/Components/v2/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ImageUpload, SwitchComponent } from "@/Components/v2/inputs";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const CreateStatusPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<BasePage>
			<ConfigBox
				title={t("pages.statusPages.form.access.title")}
				subtitle={t("pages.statusPages.form.access.description")}
				rightContent={
					<Stack
						direction="row"
						alignItems="center"
						spacing={theme.spacing(2)}
					>
						<SwitchComponent
						// checked={field.value ?? false}
						// onChange={(e) => field.onChange(e.target.checked)}
						/>
						<Typography>
							{t("pages.statusPages.form.access.option.published.name")}
						</Typography>
					</Stack>
				}
			/>
			<ConfigBox
				title={t("pages.statusPages.form.appearance.title")}
				subtitle={t("pages.statusPages.form.appearance.description")}
				rightContent={
					<Stack alignItems={"center"}>
						<ImageUpload />
					</Stack>
				}
			/>
		</BasePage>
	);
};

export default CreateStatusPage;

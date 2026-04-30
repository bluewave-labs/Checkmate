import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { EditorialStyles } from "@/Pages/StatusPage/Status/themes/editorial/styles";

export const EditorialHeader = ({
	statusPage,
	logoSrc,
	styles,
}: SlotProps<EditorialStyles>) => {
	const { t } = useTranslation();
	return (
		<Box sx={styles.brandWrap}>
			{logoSrc && (
				<Box
					component="img"
					src={logoSrc}
					alt={statusPage.companyName}
					sx={styles.logoImg}
				/>
			)}
			<Box
				component="h2"
				sx={styles.brandEyebrow}
			>
				{statusPage.companyName}
			</Box>
			<Box
				component="h1"
				sx={styles.brandTitle}
			>
				{t("pages.statusPages.editorial.reportTitle")}
			</Box>
		</Box>
	);
};

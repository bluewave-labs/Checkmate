import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { RefinedStyles } from "@/Pages/StatusPage/Status/themes/refined/styles";

export const RefinedHero = ({
	overall,
	monitorCount,
	styles,
}: SlotProps<RefinedStyles>) => {
	const { t } = useTranslation();
	return (
		<Box sx={styles.hero}>
			<Box sx={styles.heroRow}>
				<Box sx={styles.statusDot(overall.tone)} />
				<Box
					component="h1"
					sx={styles.heroTitle}
				>
					{overall.message}
				</Box>
				<Box sx={styles.heroIcon(overall.tone)}>{overall.icon}</Box>
			</Box>
			<Box
				component="p"
				sx={styles.heroSub}
			>
				{t("pages.statusPages.statusBar.monitoringSummary", {
					count: monitorCount,
				})}
			</Box>
		</Box>
	);
};

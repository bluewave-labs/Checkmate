import { useMemo } from "react";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/Utils/TimeUtils";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { EditorialStyles } from "@/Pages/StatusPage/Status/themes/editorial/styles";

export const EditorialHero = ({
	overall,
	monitorCount,
	bucketTimezone,
	styles,
}: SlotProps<EditorialStyles>) => {
	const { t, i18n } = useTranslation();
	const todayLabel = useMemo(
		() =>
			formatDate(new Date(), "date", {
				timeZone: bucketTimezone,
				locale: i18n.resolvedLanguage ?? "en",
				timeFormat: "24h",
			}),
		[bucketTimezone, i18n.resolvedLanguage]
	);

	return (
		<>
			<Box
				component="p"
				sx={styles.statusLine}
			>
				<Box
					component="span"
					sx={styles.statusDot(overall.tone)}
				/>
				{overall.message}
			</Box>
			<Box
				component="p"
				sx={styles.dateline}
			>
				{todayLabel} ·{" "}
				{t("pages.statusPages.statusBar.monitoringSummary", {
					count: monitorCount,
				})}
			</Box>
		</>
	);
};

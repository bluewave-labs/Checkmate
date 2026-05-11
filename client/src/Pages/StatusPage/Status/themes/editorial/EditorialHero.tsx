import { useMemo } from "react";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { EditorialStyles } from "@/Pages/StatusPage/Status/themes/editorial/styles";

export const EditorialHero = ({
	overall,
	monitorCount,
	styles,
}: SlotProps<EditorialStyles>) => {
	const { t } = useTranslation();
	const todayLabel = useMemo(
		() =>
			new Date().toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
				day: "numeric",
			}),
		[]
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

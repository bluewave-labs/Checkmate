import Box from "@mui/material/Box";
import { monoFirstChar } from "@/Pages/StatusPage/Status/themes/shared/overallStatus";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { BoldStyles } from "@/Pages/StatusPage/Status/themes/bold/styles";

export const BoldHeader = ({ statusPage, logoSrc, styles }: SlotProps<BoldStyles>) => (
	<Box sx={styles.brand}>
		{logoSrc ? (
			<Box
				component="img"
				src={logoSrc}
				alt={statusPage.companyName}
				sx={styles.logoImg}
			/>
		) : (
			<Box sx={styles.logoConic}>{monoFirstChar(statusPage.companyName)}</Box>
		)}
		{statusPage.companyName}
	</Box>
);

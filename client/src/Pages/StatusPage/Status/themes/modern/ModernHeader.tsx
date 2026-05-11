import Box from "@mui/material/Box";
import { monoFirstChar } from "@/Pages/StatusPage/Status/themes/shared/overallStatus";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { ModernStyles } from "@/Pages/StatusPage/Status/themes/modern/styles";

export const ModernHeader = ({
	statusPage,
	logoSrc,
	styles,
}: SlotProps<ModernStyles>) => (
	<Box sx={styles.brand}>
		{logoSrc ? (
			<Box
				component="img"
				src={logoSrc}
				alt={statusPage.companyName}
				sx={styles.logoImg}
			/>
		) : (
			<Box sx={styles.logoGrad}>{monoFirstChar(statusPage.companyName)}</Box>
		)}
		{statusPage.companyName}
	</Box>
);

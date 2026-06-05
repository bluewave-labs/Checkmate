import Box from "@mui/material/Box";
import { monoFirstChar } from "@/Pages/StatusPage/Status/themes/shared/overallStatus";
import type { SlotProps } from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import type { RefinedStyles } from "@/Pages/StatusPage/Status/themes/refined/styles";

export const RefinedHeader = ({
	statusPage,
	logoSrc,
	styles,
}: SlotProps<RefinedStyles>) => (
	<Box sx={styles.brand}>
		{logoSrc ? (
			<Box
				component="img"
				src={logoSrc}
				alt={statusPage.companyName}
				sx={styles.logoImg}
			/>
		) : (
			<Box sx={styles.logoMono}>{monoFirstChar(statusPage.companyName)}</Box>
		)}
		<Box
			component="span"
			sx={styles.company}
		>
			{statusPage.companyName}
		</Box>
	</Box>
);

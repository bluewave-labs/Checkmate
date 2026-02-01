import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { BaseBox, ValueLabel } from "@/Components/v2/design-elements";

import { useTranslation } from "react-i18next";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";

interface CardDetailsProps {
	incident: Incident | null;
	monitor: Monitor | null;
	sx?: object;
}

export const CardDetails = ({ incident, monitor, sx }: CardDetailsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	void monitor; // Will be used in future UI implementation

	if (!incident) {
		return null;
	}
	return (
		<Stack
			gap={theme.spacing(4)}
			sx={sx}
		>
			<Typography textTransform={"uppercase"}>
				{t("pages.incidents.dialog.details.title")}
			</Typography>
			<BaseBox padding={8}>
				<Stack gap={theme.spacing(4)}>
					<Typography textTransform={"uppercase"}>
						{t("pages.incidents.dialog.details.overview")}
					</Typography>
					<Divider />

					<Grid
						container
						gap={theme.spacing(4)}
					>
						<Grid size={12}>
							<Box>
								<ValueLabel
									value={incident.status ? "positive" : "negative"}
									text={
										incident.status
											? t("common.labels.active")
											: t("common.labels.resolved")
									}
								/>
							</Box>
						</Grid>
						<Grid size={6}>Test</Grid>
						<Grid size={6}>Test</Grid>
					</Grid>
				</Stack>
			</BaseBox>
		</Stack>
	);
};

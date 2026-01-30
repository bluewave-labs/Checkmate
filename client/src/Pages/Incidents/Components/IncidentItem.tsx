import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { ValueLabel } from "@/Components/v2/design-elements";
import { Globe } from "lucide-react";

import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";
import { getIncidentsDuration } from "@/Pages/Incidents/utils";

export const IncidentItem = ({
	incident,
	monitor,
}: {
	incident: Incident;
	monitor?: Monitor | null;
}) => {
	const theme = useTheme();
	const duration = getIncidentsDuration(incident);
	return (
		<Grid
			container
			alignItems="center"
			spacing={2}
			sx={{
				width: "100%",
				py: theme.spacing(0.5),
			}}
		>
			<Grid
				size={{ xs: 12, lg: 5 }}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-start",
					gap: theme.spacing(2),
				}}
			>
				<Globe />
				<Typography
					variant="body1"
					fontWeight={500}
					noWrap
				>
					{monitor ? monitor.name : "N/A"}
				</Typography>
			</Grid>

			<Grid
				size={{ xs: 12, md: 6, lg: 3 }}
				sx={{
					display: "flex",
				}}
			>
				<ValueLabel
					value={incident.status ? "negative" : "positive"}
					text={incident.status ? "Active" : "Resolved"}
				/>
			</Grid>

			<Grid
				size={{ xs: 12, md: 6, lg: 4 }}
				sx={{
					textAlign: { xs: "left", md: "right" },
					fontWeight: 500,
				}}
			>
				<Typography variant="body1">{duration}</Typography>
			</Grid>
		</Grid>
	);
};

interface SummaryItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
}

export const SummaryItem = ({ icon, label, value }: SummaryItemProps) => {
	const theme = useTheme();
	return (
		<Box>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(2)}
				py={theme.spacing(0.5)}
			>
				{icon}
				<Typography
					variant="body1"
					fontWeight={500}
				>
					{label}: {value}
				</Typography>
			</Stack>
			<Divider sx={{ mt: theme.spacing(2) }} />
		</Box>
	);
};

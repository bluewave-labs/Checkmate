import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { BaseBox } from "@/Components/v2/design-elements";
import { CircleCheck, TriangleAlert, Bell, Wrench } from "lucide-react";
import Box from "@mui/material/Box";
import { IncidentItem, SummaryItem } from "@/Pages/Incidents/Components/IncidentItem";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { Incident, IncidentSummary } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";

interface SummaryCardProps {
	title: string;
	sx?: React.CSSProperties;
}

const SummaryCard = ({
	title,
	sx,
	children,
}: React.PropsWithChildren<SummaryCardProps>) => {
	const theme = useTheme();
	return (
		<BaseBox
			sx={{ ...sx }}
			padding={8}
			flex={1}
		>
			<Stack gap={theme.spacing(4)}>
				<Typography
					component="h2"
					sx={{
						textTransform: "uppercase",
						fontWeight: 500,
						fontSize: 13,
					}}
				>
					{title}
				</Typography>
				<Divider />
				{children}
			</Stack>
		</BaseBox>
	);
};

interface SummaryCardIncidentsProps {
	incidents?: Incident[];
	monitors?: Monitor[] | null;
}

export const SummaryCardActiveIncidents = ({ incidents }: SummaryCardIncidentsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!incidents) return null;

	const activeCount = incidents.filter((incident) => incident.status === true).length;
	const hasActive = activeCount > 0;
	const color = hasActive ? theme.palette.error.main : theme.palette.success.main;
	const icon = hasActive ? (
		<TriangleAlert color={color} />
	) : (
		<CircleCheck color={color} />
	);
	const msg = t("pages.incidents.summaryCard.activeIncidents.active", { count: activeCount });

	return (
		<SummaryCard title={t("pages.incidents.summaryCard.activeIncidents.title")}>
			<Stack
				alignItems="center"
				justifyContent="center"
				gap={theme.spacing(4)}
			>
				{icon}
				<Typography>{msg}</Typography>
			</Stack>
		</SummaryCard>
	);
};

export const SummaryCardLatestIncidents = ({
	incidents,
	monitors,
}: SummaryCardIncidentsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<SummaryCard title={t("pages.incidents.summaryCard.latestIncidents.title")}>
			<Stack gap={theme.spacing(4)}>
				{incidents?.slice(0, 3).map((incident, index) => (
					<Box key={incident.id}>
						<IncidentItem
							incident={incident}
							monitor={monitors?.find((m) => m.id === incident.monitorId)}
						/>
						{index < incidents.length - 1 && <Divider sx={{ mt: theme.spacing(2) }} />}
					</Box>
				))}
			</Stack>
		</SummaryCard>
	);
};

interface SummaryCardStatsProps {
	summary?: IncidentSummary | null;
}

export const SummaryCardStats = ({ summary }: SummaryCardStatsProps) => {
	const { t } = useTranslation();
	if (!summary) return null;
	const mostAffected =
		!summary.total || summary.total === 0
			? "N/A"
			: summary.topMonitor?.monitorName || t("N/A");
	return (
		<SummaryCard title={t("pages.incidents.summaryCard.incidentStats.title")}>
			<SummaryItem
				icon={<Bell size={18} />}
				label="Total incidents"
				value={summary?.total || 0}
			/>
			<SummaryItem
				icon={<TriangleAlert size={18} />}
				label="Most affected monitor"
				value={mostAffected}
			/>
			<SummaryItem
				icon={<Wrench size={18} />}
				label="Average resolution time"
				value={summary.total > 0 ? `${summary.avgResolutionTimeHours || 0} hours` : "N/A"}
			/>
		</SummaryCard>
	);
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox, Icon, ValueLabel } from "@/Components/design-elements";
import { CircleCheck, TriangleAlert, Bell, Wrench, Globe } from "lucide-react";
import Box from "@mui/material/Box";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { IncidentSummary, IncidentSummaryItem } from "@/Types/Incident";
import { getIncidentsDuration } from "@/Pages/Incidents/utils";
import { FONT_WEIGHT, LAYOUT } from "@/Utils/Theme/constants";

interface SummaryItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
}

const SummaryItem = ({ icon, label, value }: SummaryItemProps) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			gap={theme.spacing(2)}
			minHeight={32}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(2)}
				sx={{ "& svg": { color: theme.palette.text.secondary } }}
			>
				{icon}
				<Typography variant="body1">{label}</Typography>
			</Stack>
			<Typography
				variant="body1"
				fontWeight={600}
			>
				{value}
			</Typography>
		</Stack>
	);
};

interface SummaryCardProps {
	title: string;
	sx?: React.CSSProperties;
}

export const SummaryCard = ({
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
			<Stack
				gap={theme.spacing(4)}
				height="100%"
			>
				<Typography
					component="h2"
					variant="eyebrow"
					color={theme.palette.text.secondary}
				>
					{title}
				</Typography>
				{children}
			</Stack>
		</BaseBox>
	);
};

interface SummaryCardActiveIncidentsProps {
	summary?: IncidentSummary | null;
}

export const SummaryCardActiveIncidents = ({
	summary,
}: SummaryCardActiveIncidentsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!summary) return null;

	const activeCount = summary.totalActive;
	const hasActive = activeCount > 0;
	const color = hasActive ? theme.palette.error.main : theme.palette.success.main;
	const icon = (
		<Box sx={{ color, display: "inline-flex" }}>
			<Icon
				icon={hasActive ? TriangleAlert : CircleCheck}
				size={32}
			/>
		</Box>
	);
	const msg = t("pages.incidents.summaryCard.activeIncidents.active", {
		count: activeCount,
	});

	return (
		<SummaryCard
			title={t("pages.incidents.summaryCard.activeIncidents.title")}
			sx={{ height: "100%" }}
		>
			<Stack
				flex={1}
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

const SummaryIncidentItem = ({ incident }: { incident: IncidentSummaryItem }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const duration = getIncidentsDuration(incident);
	return (
		// Name takes the free space and truncates only when it must; the pill and the
		// duration keep their natural width so no space is wasted beside the pill
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(LAYOUT.SM)}
			width="100%"
			minHeight={theme.spacing(LAYOUT.MD)}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(LAYOUT.XS)}
				flex={1}
				minWidth={0}
			>
				<Icon
					icon={Globe}
					color={theme.palette.text.secondary}
				/>
				<Typography
					variant="body1"
					fontWeight={FONT_WEIGHT.MEDIUM}
					noWrap
				>
					{incident.monitorName ?? t("common.labels.na")}
				</Typography>
			</Stack>
			<Box flexShrink={0}>
				<ValueLabel
					value={incident.status ? "negative" : "positive"}
					text={incident.status ? t("common.labels.active") : t("common.labels.resolved")}
				/>
			</Box>
			<Typography
				variant="body1"
				flexShrink={0}
				textAlign="right"
				sx={{ fontVariantNumeric: "tabular-nums" }}
			>
				{duration}
			</Typography>
		</Stack>
	);
};

interface SummaryCardLatestIncidentsProps {
	summary?: IncidentSummary | null;
}

export const SummaryCardLatestIncidents = ({
	summary,
}: SummaryCardLatestIncidentsProps) => {
	const { t } = useTranslation();

	const latestIncidents = summary?.latestIncidents ?? [];

	return (
		<SummaryCard title={t("pages.incidents.summaryCard.latestIncidents.title")}>
			{latestIncidents.slice(0, 3).map((incident) => (
				<SummaryIncidentItem
					key={incident.id}
					incident={incident}
				/>
			))}
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
			? t("common.labels.na")
			: summary.topMonitor?.monitorName || t("common.labels.na");
	return (
		<SummaryCard title={t("pages.incidents.summaryCard.incidentStats.title")}>
			<SummaryItem
				icon={<Icon icon={Bell} />}
				label={t("pages.incidents.summaryCard.incidentStats.totalIncidents")}
				value={summary?.total || 0}
			/>
			<SummaryItem
				icon={<Icon icon={TriangleAlert} />}
				label={t("pages.incidents.summaryCard.incidentStats.mostAffectedMonitor")}
				value={mostAffected}
			/>
			<SummaryItem
				icon={<Icon icon={Wrench} />}
				label={t("pages.incidents.summaryCard.incidentStats.avgResolutionTime")}
				value={
					summary.total > 0
						? `${summary.avgResolutionTimeHours || 0} hours`
						: t("common.labels.na")
				}
			/>
		</SummaryCard>
	);
};

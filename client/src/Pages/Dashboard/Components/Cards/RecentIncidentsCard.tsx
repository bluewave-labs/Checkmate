import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { useGet } from "@/Hooks/UseApi";
import { Dot } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatDuration, formatTimestamp } from "@/Utils/TimeUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardRow, CardRowLabel } from "../CardPrimitives";

import type { IncidentSummary, IncidentSummaryItem } from "@/Types/Incident";

const MAX_ROWS = 5;

/** Open incidents have no end time; closed ones report how long they ran. */
const incidentDuration = (incident: IncidentSummaryItem): string | null => {
	if (!incident.endTime) {
		return null;
	}
	const ms =
		new Date(incident.endTime).getTime() - new Date(incident.startTime).getTime();
	return ms > 0 ? formatDuration(ms) : null;
};

export const RecentIncidentsCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useGet<IncidentSummary>(
		"/incidents/team/summary"
	);

	const incidents = (data?.latestIncidents ?? []).slice(0, MAX_ROWS);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.recentIncidents.title")}
			to="/incidents"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
			action={
				data && data.totalActive > 0 ? (
					<Typography color={theme.palette.error.main}>
						{t("pages.dashboard.cards.recentIncidents.active", {
							count: data.totalActive,
						})}
					</Typography>
				) : null
			}
		>
			{incidents.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.recentIncidents.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					{incidents.map((incident) => {
						const isOpen = incident.status === true;
						const duration = incidentDuration(incident);
						return (
							<CardRow
								key={incident.id}
								to="/incidents"
							>
								<Dot
									color={isOpen ? theme.palette.error.light : theme.palette.success.light}
									size="md"
								/>
								<CardRowLabel
									primary={
										incident.monitorName ??
										t("pages.dashboard.cards.recentIncidents.unknownMonitor")
									}
									secondary={formatTimestamp(incident.startTime)}
								/>
								<Typography
									color={theme.palette.text.secondary}
									sx={{ flexShrink: 0 }}
								>
									{isOpen
										? t("pages.dashboard.cards.recentIncidents.ongoing")
										: (duration ?? "—")}
								</Typography>
								{incident.resolutionType === "manual" && (
									<Typography
										color={theme.palette.warning.main}
										sx={{ flexShrink: 0 }}
									>
										{t("pages.dashboard.cards.recentIncidents.manual")}
									</Typography>
								)}
							</CardRow>
						);
					})}
				</Stack>
			)}
		</DashboardCard>
	);
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { useGet } from "@/Hooks/UseApi";
import { Dot } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatTimestamp } from "@/Utils/TimeUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardFigure, CardRow, CardRowLabel } from "../CardPrimitives";

import type { IncidentSummary } from "@/Types/Incident";
import type { Notification } from "@/Types/Notification";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";
import type { StatusPage } from "@/Types/StatusPage";

const StatLine = ({ label, value }: { label: string; value: string }) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="baseline"
			justifyContent="space-between"
			gap={theme.spacing(LAYOUT.SM)}
		>
			<Typography
				fontSize={typographyLevels.s}
				color={theme.palette.text.secondary}
			>
				{label}
			</Typography>
			<Typography
				fontSize={typographyLevels.m}
				color={theme.palette.text.primary}
				noWrap
			>
				{value}
			</Typography>
		</Stack>
	);
};

/** Free when Recent incidents is present — same summary call, shared by SWR. */
export const IncidentStatsCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useGet<IncidentSummary>(
		"/incidents/team/summary"
	);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.incidentStats.title")}
			to="/incidents"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{data && (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<CardFigure
						value={String(data.totalActive)}
						caption={t("pages.dashboard.cards.incidentStats.openNow")}
						color={
							data.totalActive > 0 ? theme.palette.error.main : theme.palette.text.primary
						}
					/>
					<StatLine
						label={t("pages.dashboard.cards.incidentStats.avgResolution")}
						value={t("pages.dashboard.cards.incidentStats.hours", {
							hours: data.avgResolutionTimeHours.toFixed(1),
						})}
					/>
					{data.topMonitor?.monitorName && (
						<StatLine
							label={t("pages.dashboard.cards.incidentStats.mostIncidents")}
							value={`${data.topMonitor.monitorName} (${data.topMonitor.incidentCount})`}
						/>
					)}
				</Stack>
			)}
		</DashboardCard>
	);
};

export const NotificationChannelsCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } =
		useGet<Notification[]>("/notifications/team");

	// The response also carries accessToken and accountSid. Only `type` is read
	// here — credential fields must never reach the DOM.
	const byType = useMemo(() => {
		const counts = new Map<string, number>();
		for (const notification of data ?? []) {
			counts.set(notification.type, (counts.get(notification.type) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.notificationChannels.title")}
			to="/notifications"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{byType.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.notificationChannels.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					{byType.map(([type, count]) => (
						<StatLine
							key={type}
							label={type}
							value={String(count)}
						/>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

export const MaintenanceCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useGet<{
		maintenanceWindows: MaintenanceWindow[];
		maintenanceWindowCount: number;
	}>("/maintenance-window/team?page=0&rowsPerPage=0");

	// `active` is a user on/off flag, not "running now" — compare the window
	// client-side. repeat > 0 means recurring, so `end` may sit in the past for
	// a window that is currently live.
	const { running, next } = useMemo(() => {
		const now = Date.now();
		const windows = (data?.maintenanceWindows ?? []).filter((entry) => entry.active);
		const live = windows.filter((entry) => {
			const start = new Date(entry.start).getTime();
			const end = new Date(entry.end).getTime();
			return start <= now && (now <= end || entry.repeat > 0);
		});
		const upcoming = windows
			.filter((entry) => new Date(entry.start).getTime() > now)
			.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
		return { running: live.length, next: upcoming[0] ?? null };
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.maintenance.title")}
			to="/maintenance"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{!data || data.maintenanceWindows.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.maintenance.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<CardFigure
						value={String(running)}
						caption={t("pages.dashboard.cards.maintenance.runningNow")}
					/>
					{next && (
						<StatLine
							label={t("pages.dashboard.cards.maintenance.next")}
							value={formatTimestamp(next.start)}
						/>
					)}
				</Stack>
			)}
		</DashboardCard>
	);
};

export const StatusPagesCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } =
		useGet<StatusPage[]>("/status-page/team");

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.statusPages.title")}
			to="/status"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{!data || data.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.statusPages.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					{data.map((page) => (
						<CardRow
							key={page.id}
							to={`/status/${page.url}`}
						>
							<Dot
								color={
									page.isPublished
										? theme.palette.success.light
										: theme.palette.text.secondary
								}
								size="md"
							/>
							<CardRowLabel
								primary={page.companyName}
								secondary={t("pages.dashboard.cards.statusPages.monitorCount", {
									count: page.monitors.length,
								})}
							/>
							<Typography
								fontSize={typographyLevels.s}
								color={theme.palette.text.secondary}
								flexShrink={0}
							>
								{page.isPublished
									? t("pages.dashboard.cards.statusPages.published")
									: t("pages.dashboard.cards.statusPages.draft")}
							</Typography>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

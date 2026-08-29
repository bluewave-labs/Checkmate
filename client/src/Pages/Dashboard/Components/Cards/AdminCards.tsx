import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { useGet } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatTimestamp } from "@/Utils/TimeUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardFigure, CardRow, CardRowLabel } from "../CardPrimitives";

import { REFRESH_INTERVAL_MS, SLOW_REFRESH_INTERVAL_MS } from "../../cards";

import type { QueueMetrics } from "@/Types/Queue";
import type { Log } from "@/Types/Log";
import type { User } from "@/Types/User";

const MAX_ERROR_ROWS = 5;

const StatLine = ({
	label,
	value,
	color,
}: {
	label: string;
	value: string;
	color?: string;
}) => {
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
				color={color ?? theme.palette.text.primary}
			>
				{value}
			</Typography>
		</Stack>
	);
};

/** Reads as a single reassurance line while nothing is failing. */
export const ChecksOnScheduleCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useGet<QueueMetrics>(
		"/queue/metrics",
		{},
		{ refreshInterval: REFRESH_INTERVAL_MS }
	);

	const healthy = data?.failingJobs === 0;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.checksOnSchedule.title")}
			to="/logs"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{data && (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{healthy ? (
						<CardMessage
							text={t("pages.dashboard.cards.checksOnSchedule.healthy", {
								jobs: data.jobs,
								workers: data.workers.length,
							})}
						/>
					) : (
						<>
							<CardFigure
								value={String(data.failingJobs)}
								caption={t("pages.dashboard.cards.checksOnSchedule.failing")}
								color={theme.palette.error.main}
							/>
							<Stack gap={theme.spacing(LAYOUT.XS)}>
								{data.jobsWithFailures.slice(0, MAX_ERROR_ROWS).map((job) => (
									<CardRow key={String(job.monitorId)}>
										<CardRowLabel
											primary={job.monitorUrl ?? String(job.monitorId)}
											secondary={job.failReason}
										/>
										<Typography
											fontSize={typographyLevels.s}
											color={theme.palette.error.main}
											flexShrink={0}
										>
											{job.failCount}
										</Typography>
									</CardRow>
								))}
							</Stack>
						</>
					)}
					<StatLine
						label={t("pages.dashboard.cards.checksOnSchedule.scheduled")}
						value={String(data.jobs)}
					/>
					<StatLine
						label={t("pages.dashboard.cards.checksOnSchedule.runningNow")}
						value={String(data.activeJobs)}
					/>
				</Stack>
			)}
		</DashboardCard>
	);
};

/**
 * /logs is an in-memory ring buffer capped at 1000 entries, wiped on restart,
 * and it ignores page/rowsPerPage. It rotates fast, so this is deliberately
 * worded "recent" rather than "all".
 */
export const RecentErrorsCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useGet<Log[]>(
		"/logs",
		{},
		{ refreshInterval: SLOW_REFRESH_INTERVAL_MS }
	);

	const { errors, warnings, newest } = useMemo(() => {
		const relevant = (data ?? []).filter(
			(entry) => entry.level === "error" || entry.level === "warn"
		);
		const sorted = [...relevant].sort(
			(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);
		return {
			errors: relevant.filter((entry) => entry.level === "error").length,
			warnings: relevant.filter((entry) => entry.level === "warn").length,
			newest: sorted.slice(0, MAX_ERROR_ROWS),
		};
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.recentErrors.title")}
			to="/logs"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
			action={
				errors > 0 ? (
					<Typography
						fontSize={typographyLevels.s}
						color={theme.palette.error.main}
					>
						{t("pages.dashboard.cards.recentErrors.count", { count: errors })}
					</Typography>
				) : null
			}
		>
			{newest.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.recentErrors.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<StatLine
						label={t("pages.dashboard.cards.recentErrors.warnings")}
						value={String(warnings)}
					/>
					<Stack gap={theme.spacing(LAYOUT.XS)}>
						{newest.map((entry, index) => (
							<CardRow key={`${entry.timestamp}-${index}`}>
								<CardRowLabel
									primary={entry.message}
									secondary={[entry.service, entry.method].filter(Boolean).join(" · ")}
								/>
								<Typography
									fontSize={typographyLevels.s}
									color={
										entry.level === "error"
											? theme.palette.error.main
											: theme.palette.warning.main
									}
									flexShrink={0}
								>
									{formatTimestamp(entry.timestamp)}
								</Typography>
							</CardRow>
						))}
					</Stack>
				</Stack>
			)}
		</DashboardCard>
	);
};

/** Never empty — at minimum the current user exists. */
export const TeamCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useGet<User[]>("/auth/users");

	const { total, byRole, unverified } = useMemo(() => {
		const users = data ?? [];
		const roles = new Map<string, number>();
		for (const user of users) {
			for (const role of user.role ?? []) {
				roles.set(role, (roles.get(role) ?? 0) + 1);
			}
		}
		return {
			total: users.length,
			byRole: [...roles.entries()].sort((a, b) => b[1] - a[1]),
			unverified: users.filter((user) => !user.isVerified).length,
		};
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.team.title")}
			to="/account/team"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{data && (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<CardFigure
						value={String(total)}
						caption={t("pages.dashboard.cards.team.members", { count: total })}
					/>
					{byRole.map(([role, count]) => (
						<StatLine
							key={role}
							label={t(`common.auth.roles.${role}`, { defaultValue: role })}
							value={String(count)}
						/>
					))}
					{unverified > 0 && (
						<StatLine
							label={t("pages.dashboard.cards.team.unverified")}
							value={String(unverified)}
							color={theme.palette.warning.main}
						/>
					)}
				</Stack>
			)}
		</DashboardCard>
	);
};

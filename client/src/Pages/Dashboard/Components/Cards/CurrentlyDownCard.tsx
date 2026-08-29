import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { Dot } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { getStatusColor, getMonitorPath } from "@/Utils/MonitorUtils";
import { formatStatusCode } from "@/Utils/statusCode";
import { formatDuration } from "@/Utils/TimeUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardRow } from "../CardPrimitives";
import { Sparkline } from "../Sparkline";
import { useMonitors } from "../../useDashboardData";

import type { Monitor, MonitorStatus } from "@/Types/Monitor";

// Ordering, not a severity scale — Checkmate has none. Every input already
// exists in the API response.
//
// `initializing` is deliberately excluded: on a fresh install every new monitor
// starts there, and counting it would open the card red claiming a fleet-wide
// outage that does not exist. It is "not checked yet", not "broken".
const SPARKLINE_WIDTH = 80;

const STATUS_RANK: Partial<Record<MonitorStatus, number>> = {
	down: 1,
	breached: 2,
};

const isProblem = (monitor: Monitor) => STATUS_RANK[monitor.status] !== undefined;

/**
 * How long the monitor has been in its current state, inferred from the oldest
 * consecutive failing check.
 *
 * recentChecks is oldest-first — the server appends each snapshot with
 * `$push … $slice: -N` — so the run of current failures is walked backwards
 * from the end.
 */
const downSince = (monitor: Monitor): string | null => {
	const checks = monitor.recentChecks ?? [];
	let oldestFailing: string | null = null;
	for (let index = checks.length - 1; index >= 0; index -= 1) {
		if (checks[index].status === true) {
			break;
		}
		oldestFailing = checks[index].createdAt;
	}
	return oldestFailing;
};

/** The newest retained check — recentChecks is oldest-first. */
const latestCheck = (monitor: Monitor) =>
	monitor.recentChecks?.[monitor.recentChecks.length - 1];

export const CurrentlyDownCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();

	const problems = useMemo(() => {
		const monitors = data?.monitors ?? [];
		return monitors
			.filter(isProblem)
			.map((monitor) => ({ monitor, since: downSince(monitor) }))
			.sort((a, b) => {
				const rank =
					(STATUS_RANK[a.monitor.status] ?? 99) - (STATUS_RANK[b.monitor.status] ?? 99);
				if (rank !== 0) {
					return rank;
				}
				// Tie-break on longest downtime: the older timestamp ranks first.
				return new Date(a.since ?? 0).getTime() - new Date(b.since ?? 0).getTime();
			});
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.currentlyDown.title")}
			to="/incidents"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
			action={
				problems.length > 0 ? (
					<Typography color={theme.palette.error.main}>
						{t("pages.dashboard.cards.currentlyDown.count", {
							count: problems.length,
						})}
					</Typography>
				) : null
			}
		>
			{problems.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.currentlyDown.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					{problems.map(({ monitor, since }) => (
						<CardRow
							key={monitor.id}
							to={`/${getMonitorPath(monitor.type)}/${monitor.id}`}
						>
							<Dot
								color={getStatusColor(monitor.status, theme)}
								size="md"
							/>
							{/*
							 * Two lines rather than one wide row: at half width seven
							 * columns would crush the monitor name, so the name and how long
							 * it has been down lead, and the supporting detail sits beneath
							 * in a quieter line.
							 */}
							<Stack
								flex={1}
								minWidth={0}
								gap={theme.spacing(LAYOUT.XXS)}
							>
								<Stack
									direction="row"
									alignItems="baseline"
									justifyContent="space-between"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<Typography
										color={theme.palette.text.primary}
										noWrap
									>
										{monitor.name}
									</Typography>
									{since && (
										<Typography
											color={theme.palette.error.main}
											flexShrink={0}
										>
											{formatDuration(Date.now() - new Date(since).getTime())}
										</Typography>
									)}
								</Stack>
								<Stack
									direction="row"
									alignItems="center"
									justifyContent="space-between"
									gap={theme.spacing(LAYOUT.SM)}
								>
									{/*
									 * Plain text rather than StatusCodeLabel: that component
									 * wraps its body in a Tooltip, and a focusable element
									 * inside the row's link is unreachable by keyboard.
									 */}
									<Typography
										color={theme.palette.text.secondary}
										noWrap
									>
										{monitor.type} ·{" "}
										{formatStatusCode(latestCheck(monitor)?.statusCode, t)}
									</Typography>
									<Box
										width={SPARKLINE_WIDTH}
										flexShrink={0}
									>
										<Sparkline
											checks={monitor.recentChecks ?? []}
											color={theme.palette.error.main}
										/>
									</Box>
								</Stack>
							</Stack>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

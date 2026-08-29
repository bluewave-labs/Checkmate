import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { Dot, StatusCodeLabel } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { getStatusColor, getMonitorPath } from "@/Utils/MonitorUtils";
import { formatDuration } from "@/Utils/TimeUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardRow, CardRowLabel } from "../CardPrimitives";
import { Sparkline } from "../Sparkline";
import { useMonitors } from "../../useDashboardData";

import type { Monitor, MonitorStatus } from "@/Types/Monitor";

// Ordering, not a severity scale — Checkmate has none. Every input already
// exists in the API response.
const STATUS_RANK: Partial<Record<MonitorStatus, number>> = {
	down: 1,
	breached: 2,
	initializing: 3,
};

const isProblem = (monitor: Monitor) => STATUS_RANK[monitor.status] !== undefined;

/**
 * How long the monitor has been in its current state, inferred from the oldest
 * consecutive failing check. recentChecks is newest-first.
 */
const downSince = (monitor: Monitor): string | null => {
	const checks = monitor.recentChecks ?? [];
	let oldestFailing: string | null = null;
	for (const check of checks) {
		if (check.status === true) {
			break;
		}
		oldestFailing = check.createdAt;
	}
	return oldestFailing;
};

export const CurrentlyDownCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, error } = useMonitors();

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
			action={
				problems.length > 0 ? (
					<Typography
						fontSize={typographyLevels.s}
						color={theme.palette.error.main}
					>
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
							<CardRowLabel
								primary={monitor.name}
								secondary={monitor.url}
							/>
							<Typography
								fontSize={typographyLevels.s}
								color={theme.palette.text.secondary}
								flexShrink={0}
							>
								{monitor.type}
							</Typography>
							{since && (
								<Typography
									fontSize={typographyLevels.s}
									color={theme.palette.error.main}
									flexShrink={0}
									minWidth={64}
									textAlign="right"
								>
									{formatDuration(Date.now() - new Date(since).getTime())}
								</Typography>
							)}
							<Box
								width={80}
								flexShrink={0}
								display={{ xs: "none", md: "block" }}
							>
								<Sparkline
									checks={monitor.recentChecks ?? []}
									color={theme.palette.error.main}
								/>
							</Box>
							<Box flexShrink={0}>
								<StatusCodeLabel statusCode={monitor.recentChecks?.[0]?.statusCode} />
							</Box>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

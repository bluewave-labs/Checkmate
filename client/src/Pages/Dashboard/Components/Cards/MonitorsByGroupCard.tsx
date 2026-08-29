import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardBar, CardRow } from "../CardPrimitives";
import { useMonitors } from "../../useDashboardData";

interface GroupBucket {
	group: string;
	total: number;
	down: number;
}

export const MonitorsByGroupCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();

	// `group` is a plain string | null on the monitor — there is no groups
	// endpoint, so the set is whatever monitors actually declare.
	const buckets = useMemo<GroupBucket[]>(() => {
		const byGroup = new Map<string, GroupBucket>();
		for (const monitor of data?.monitors ?? []) {
			if (!monitor.group) {
				continue;
			}
			const bucket = byGroup.get(monitor.group) ?? {
				group: monitor.group,
				total: 0,
				down: 0,
			};
			bucket.total += 1;
			if (monitor.status === "down" || monitor.status === "breached") {
				bucket.down += 1;
			}
			byGroup.set(monitor.group, bucket);
		}
		return [...byGroup.values()].sort((a, b) => b.total - a.total);
	}, [data]);

	const max = buckets[0]?.total ?? 0;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.monitorsByGroup.title")}
			to="/uptime"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{buckets.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.monitorsByGroup.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{buckets.map((bucket) => (
						<CardRow key={bucket.group}>
							<Stack
								flex={1}
								minWidth={0}
								gap={theme.spacing(LAYOUT.XXS)}
							>
								<Stack
									direction="row"
									alignItems="center"
									justifyContent="space-between"
									gap={theme.spacing(LAYOUT.SM)}
								>
									<Typography
										fontSize={typographyLevels.m}
										color={theme.palette.text.primary}
										noWrap
									>
										{bucket.group}
									</Typography>
									<Stack
										direction="row"
										alignItems="center"
										gap={theme.spacing(LAYOUT.XS)}
										flexShrink={0}
									>
										{bucket.down > 0 && (
											<Typography
												fontSize={typographyLevels.s}
												color={theme.palette.error.main}
											>
												{t("pages.dashboard.cards.monitorsByType.down", {
													count: bucket.down,
												})}
											</Typography>
										)}
										<Typography
											fontSize={typographyLevels.m}
											color={theme.palette.text.secondary}
										>
											{bucket.total}
										</Typography>
									</Stack>
								</Stack>
								<CardBar
									value={bucket.total}
									max={max}
									color={
										bucket.down > 0
											? theme.palette.error.main
											: theme.palette.primary.main
									}
								/>
							</Stack>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

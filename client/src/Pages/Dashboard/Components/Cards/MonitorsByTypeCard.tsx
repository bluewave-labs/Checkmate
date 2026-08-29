import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { getMonitorPath } from "@/Utils/MonitorUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardBar, CardRow } from "../CardPrimitives";
import { useMonitors } from "../../useDashboardData";

import type { MonitorType } from "@/Types/Monitor";

interface TypeBucket {
	type: MonitorType;
	total: number;
	down: number;
}

export const MonitorsByTypeCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();

	const buckets = useMemo<TypeBucket[]>(() => {
		const byType = new Map<MonitorType, TypeBucket>();
		for (const monitor of data?.monitors ?? []) {
			const bucket = byType.get(monitor.type) ?? {
				type: monitor.type,
				total: 0,
				down: 0,
			};
			bucket.total += 1;
			if (monitor.status === "down" || monitor.status === "breached") {
				bucket.down += 1;
			}
			byType.set(monitor.type, bucket);
		}
		return [...byType.values()].sort((a, b) => b.total - a.total);
	}, [data]);

	const max = buckets[0]?.total ?? 0;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.monitorsByType.title")}
			to="/uptime"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{buckets.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.monitorsByType.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{buckets.map((bucket) => (
						<CardRow
							key={bucket.type}
							to={`/${getMonitorPath(bucket.type)}`}
						>
							<Stack
								gap={theme.spacing(LAYOUT.XXS)}
								flex={1}
								minWidth={0}
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
									>
										{bucket.type}
									</Typography>
									<Stack
										direction="row"
										alignItems="center"
										gap={theme.spacing(LAYOUT.XS)}
									>
										{bucket.down > 0 && (
											<Typography
												fontSize={typographyLevels.m}
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
								<Box>
									<CardBar
										value={bucket.total}
										max={max}
										color={
											bucket.down > 0
												? theme.palette.error.main
												: theme.palette.primary.main
										}
									/>
								</Box>
							</Stack>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardBar, CardRow, CardRowLabel } from "../CardPrimitives";
import { useMonitors } from "../../useDashboardData";

import type { Monitor } from "@/Types/Monitor";

// <60% fine, 60-85% warm, above that hot.
const WARM = 60;
const HOT = 85;

interface ServerUsage {
	monitor: Monitor;
	cpu: number | null;
	memory: number | null;
	disk: number | null;
	peak: number;
}

const Metric = ({ label, value }: { label: string; value: number | null }) => {
	const theme = useTheme();
	const color =
		value === null
			? theme.palette.text.secondary
			: value > HOT
				? theme.palette.error.main
				: value > WARM
					? theme.palette.warning.main
					: theme.palette.primary.main;

	return (
		<Stack
			flex={1}
			minWidth={0}
			gap={theme.spacing(LAYOUT.XXS)}
		>
			<Stack
				direction="row"
				alignItems="baseline"
				justifyContent="space-between"
				gap={theme.spacing(LAYOUT.XS)}
			>
				<Typography
					fontSize={typographyLevels.s}
					color={theme.palette.text.secondary}
				>
					{label}
				</Typography>
				<Typography
					fontSize={typographyLevels.s}
					color={color}
				>
					{/* A down server reports nothing — show a dash, never 0%. */}
					{value === null ? "—" : `${value.toFixed(1)}%`}
				</Typography>
			</Stack>
			<CardBar
				value={value ?? 0}
				color={color}
			/>
		</Stack>
	);
};

export const BusiestServersCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();

	const servers = useMemo<ServerUsage[]>(() => {
		return (data?.monitors ?? [])
			.filter((monitor) => monitor.type === "hardware")
			.map((monitor) => {
				const checks = monitor.recentChecks ?? [];
				// recentChecks is oldest-first: the newest snapshot is last.
				const latest = checks[checks.length - 1];
				// Note snake_case here, unlike camelCase in HardwareCheckStats.
				// These are 0-1 fractions, so scale to percent.
				const toPercent = (value: number | undefined) =>
					typeof value === "number" ? value * 100 : null;
				const cpu = toPercent(latest?.cpu?.usage_percent);
				const memory = toPercent(latest?.memory?.usage_percent);
				const disks = (latest?.disk ?? [])
					.map((entry) => entry.usage_percent)
					.filter((value): value is number => typeof value === "number");
				const disk = disks.length > 0 ? Math.max(...disks) * 100 : null;
				return {
					monitor,
					cpu,
					memory,
					disk,
					peak: Math.max(cpu ?? 0, memory ?? 0, disk ?? 0),
				};
			})
			.sort((a, b) => b.peak - a.peak);
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.busiestServers.title")}
			to="/infrastructure"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{servers.length === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.busiestServers.empty")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					{servers.map(({ monitor, cpu, memory, disk }) => (
						<CardRow
							key={monitor.id}
							to={`/infrastructure/${monitor.id}`}
						>
							<Stack
								flex={1}
								minWidth={0}
								gap={theme.spacing(LAYOUT.XS)}
							>
								<CardRowLabel primary={monitor.name} />
								<Stack
									direction="row"
									gap={theme.spacing(LAYOUT.MD)}
								>
									<Metric
										label={t("pages.dashboard.cards.busiestServers.cpu")}
										value={cpu}
									/>
									<Metric
										label={t("pages.dashboard.cards.busiestServers.memory")}
										value={memory}
									/>
									<Metric
										label={t("pages.dashboard.cards.busiestServers.disk")}
										value={disk}
									/>
								</Stack>
							</Stack>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

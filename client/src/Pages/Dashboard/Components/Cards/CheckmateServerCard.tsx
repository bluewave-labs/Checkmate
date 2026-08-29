import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { useGet } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatDuration } from "@/Utils/TimeUtils";
import { DashboardCard } from "../DashboardCard";
import { CardBar } from "../CardPrimitives";

import type { Diagnostics } from "@/Types/Diagnostics";

const BYTES_PER_MB = 1024 * 1024;

// Banding from CARD-SPECS: warm at 50ms of event-loop delay, hot at 200ms;
// heap warm past 80% of the V8 limit.
const EVENT_LOOP_WARM_MS = 50;
const EVENT_LOOP_HOT_MS = 200;
const HEAP_WARM_RATIO = 0.8;

const MetricLine = ({
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

/**
 * The one card that is never empty — it reports on Checkmate itself, so it
 * works on a fresh install with zero monitors. Admin only.
 */
export const CheckmateServerCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, error } = useGet<Diagnostics>(
		"/diagnostic/system",
		{},
		{ refreshInterval: 30000 }
	);

	const usedHeap = data?.v8HeapStats.usedHeapSizeBytes ?? 0;
	const heapLimit = data?.v8HeapStats.heapSizeLimitBytes ?? 0;
	const heapRatio = heapLimit > 0 ? usedHeap / heapLimit : 0;
	const heapColor =
		heapRatio > HEAP_WARM_RATIO ? theme.palette.warning.main : theme.palette.primary.main;

	const eventLoopMs = data?.eventLoopDelayMs ?? 0;
	const eventLoopColor =
		eventLoopMs > EVENT_LOOP_HOT_MS
			? theme.palette.error.main
			: eventLoopMs > EVENT_LOOP_WARM_MS
				? theme.palette.warning.main
				: theme.palette.text.primary;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.checkmateServer.title")}
			to="/logs"
			isLoading={isLoading && !data}
			error={error}
		>
			{data && (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<Stack gap={theme.spacing(LAYOUT.XXS)}>
						<MetricLine
							label={t("pages.dashboard.cards.checkmateServer.memory")}
							value={`${Math.round(usedHeap / BYTES_PER_MB)} / ${Math.round(
								heapLimit / BYTES_PER_MB
							)} MB`}
							color={heapColor}
						/>
						<CardBar
							value={heapRatio * 100}
							color={heapColor}
						/>
					</Stack>
					<MetricLine
						label={t("pages.dashboard.cards.checkmateServer.eventLoop")}
						value={`${eventLoopMs.toFixed(1)} ms`}
						color={eventLoopColor}
					/>
					<MetricLine
						label={t("pages.dashboard.cards.checkmateServer.uptime")}
						value={formatDuration(data.uptimeMs)}
					/>
					<MetricLine
						label={t("pages.dashboard.cards.checkmateServer.database")}
						value={t("pages.dashboard.cards.checkmateServer.readsWrites", {
							reads: data.mongoStats.readsPerSecond.toFixed(1),
							writes: data.mongoStats.writesPerSecond.toFixed(1),
						})}
					/>
				</Stack>
			)}
		</DashboardCard>
	);
};

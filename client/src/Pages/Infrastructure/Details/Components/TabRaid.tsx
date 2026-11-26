import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatBox, Tab, Table, Tabs } from "@/Components/design-elements";
import type { Header } from "@/Components/design-elements";
import {
	MetricsChartGrid,
	type MetricsChartConfig,
} from "@/Pages/Infrastructure/Details/Components/MetricsChartGrid";
import { hasValues } from "@/Pages/Infrastructure/Details/utils";

import { useState } from "react";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useFormatDate } from "@/Hooks/useFormatDate";
import type {
	HardwareMetricsRaid,
	HardwareMetricsRaidBucket,
	HardwareMetricsRaidLatest,
	HardwareMetricsRaidMember,
	HardwareMetricsResponse,
} from "@/Types/Monitor";
import type { DateRange } from "@/Types/Query";
import { formatNumber, formatPercentage, PLACEHOLDER } from "@/Utils/FormatUtils";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import { tooltipBucketDate, tooltipDateFormatLookup } from "@/Utils/TimeUtils";

type MemberRow = HardwareMetricsRaidMember & { id: string };
type HistoryRow = HardwareMetricsRaidBucket & { id: string };

const getDegradedPalette = (degradedDisks: number | null): PaletteKey | undefined => {
	if (!degradedDisks) return undefined;
	return "error";
};

const joinOrPlaceholder = (values: string[]) => {
	if (values.length === 0) return PLACEHOLDER;
	return values.join(", ");
};

const sameValues = (a: string[], b: string[]) => a.join() === b.join();

const getStateChanges = (buckets: HardwareMetricsRaidBucket[]): HistoryRow[] =>
	buckets
		.filter((bucket, index) => {
			const previous = buckets[index - 1];
			if (!previous) return true;
			return (
				!sameValues(bucket.states, previous.states) ||
				!sameValues(bucket.syncActions, previous.syncActions)
			);
		})
		.map((bucket) => ({ ...bucket, id: bucket.bucketDate }));

const getChartConfigs = (
	buckets: HardwareMetricsRaidBucket[],
	t: TFunction
): MetricsChartConfig[] => {
	if (!hasValues(buckets, ["maxDegradedDisks"])) return [];
	const label = t("pages.infrastructure.raid.degradedDisks");
	return [
		{
			key: "degradedDisks",
			title: label,
			series: [{ dataKey: "maxDegradedDisks", label }],
			formatter: (value) => formatNumber(value),
		},
	];
};

const RaidSummary = ({ latest }: { latest: HardwareMetricsRaidLatest }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			gap={theme.spacing(LAYOUT.MD)}
			flexWrap={"wrap"}
		>
			<StatBox
				title={t("pages.infrastructure.raid.state")}
				subtitle={latest.state ?? PLACEHOLDER}
			/>
			<StatBox
				title={t("pages.infrastructure.raid.level")}
				subtitle={latest.level ?? PLACEHOLDER}
			/>
			<StatBox
				title={t("pages.infrastructure.raid.disks")}
				subtitle={formatNumber(latest.raidDisks)}
			/>
			<StatBox
				title={t("pages.infrastructure.raid.degradedDisks")}
				subtitle={formatNumber(latest.degradedDisks)}
				palette={getDegradedPalette(latest.degradedDisks)}
			/>
			<StatBox
				title={t("pages.infrastructure.raid.syncAction")}
				subtitle={latest.syncAction ?? PLACEHOLDER}
			/>
			{latest.syncProgress !== null && (
				<StatBox
					title={t("pages.infrastructure.raid.syncProgress")}
					subtitle={formatPercentage(latest.syncProgress)}
				/>
			)}
		</Stack>
	);
};

const RaidMembers = ({ members }: { members: HardwareMetricsRaidMember[] }) => {
	const { t } = useTranslation();
	const rows: MemberRow[] = members.map((member) => ({ ...member, id: member.device }));
	const headers: Header<MemberRow>[] = [
		{
			id: "device",
			content: t("pages.infrastructure.raid.member"),
			render: (row) => <Typography>{row.device}</Typography>,
		},
		{
			id: "state",
			content: t("pages.infrastructure.raid.state"),
			render: (row) => <Typography>{row.state}</Typography>,
		},
	];

	return (
		<Table
			headers={headers}
			data={rows}
		/>
	);
};

const RaidHistory = ({
	buckets,
	dateRange,
}: {
	buckets: HardwareMetricsRaidBucket[];
	dateRange: DateRange;
}) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const rows = getStateChanges(buckets);
	const headers: Header<HistoryRow>[] = [
		{
			id: "time",
			content: t("pages.infrastructure.raid.time"),
			render: (row) => (
				<Typography>
					{formatDate(
						tooltipBucketDate(row.bucketDate, dateRange),
						tooltipDateFormatLookup(dateRange)
					)}
				</Typography>
			),
		},
		{
			id: "states",
			content: t("pages.infrastructure.raid.state"),
			render: (row) => <Typography>{joinOrPlaceholder(row.states)}</Typography>,
		},
		{
			id: "syncActions",
			content: t("pages.infrastructure.raid.syncAction"),
			render: (row) => <Typography>{joinOrPlaceholder(row.syncActions)}</Typography>,
		},
	];

	if (rows.length === 0) return null;

	return (
		<Table
			headers={headers}
			data={rows}
		/>
	);
};

const RaidBlock = ({
	array,
	dateRange,
}: {
	array: HardwareMetricsRaid;
	dateRange: DateRange;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<Stack gap={theme.spacing(LAYOUT.LG)}>
			{array.latest && <RaidSummary latest={array.latest} />}
			{array.latest && <RaidMembers members={array.latest.members} />}
			<MetricsChartGrid
				configs={getChartConfigs(array.buckets, t)}
				data={array.buckets}
				dateRange={dateRange}
			/>
			<RaidHistory
				buckets={array.buckets}
				dateRange={dateRange}
			/>
		</Stack>
	);
};

export const TabRaid = ({
	metrics,
	dateRange,
}: {
	metrics: HardwareMetricsResponse | null;
	dateRange: DateRange;
}) => {
	const theme = useTheme();
	const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
	if (!metrics) return null;

	const arrays = metrics.raid;
	const selected = arrays.find((array) => array.device === selectedDevice) ?? arrays[0];
	if (!selected) return null;

	return (
		<Stack gap={theme.spacing(LAYOUT.LG)}>
			<Tabs
				value={selected.device}
				variant="scrollable"
				scrollButtons={false}
				onChange={(_e, value) => {
					setSelectedDevice(value);
				}}
			>
				{arrays.map((array) => (
					<Tab
						key={array.device}
						value={array.device}
						label={array.device}
					/>
				))}
			</Tabs>
			<RaidBlock
				array={selected}
				dateRange={dateRange}
			/>
		</Stack>
	);
};

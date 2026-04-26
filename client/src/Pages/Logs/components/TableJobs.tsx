import { Table } from "@/Components/design-elements";
import { Typography, useTheme } from "@mui/material";
import prettyMilliseconds from "pretty-ms";
import { formatTimestamp } from "@/Utils/TimeUtils";

import { useTranslation } from "react-i18next";
import type { QueueJobFailure, QueueJobSummary, QueueMetrics } from "@/Types/Queue";
import type { Header } from "@/Components/design-elements";

type QueueJobWithId = QueueJobSummary & { id: string | number };

interface TableJobsProps {
	jobs: QueueJobSummary[];
}

export const TableJobs = ({ jobs }: TableJobsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const jobsWithId: QueueJobWithId[] = jobs.map((job) => ({
		...job,
		id: job.monitorId,
	}));

	const cellSx = {
		whiteSpace: "nowrap" as const,
		overflow: "hidden",
		textOverflow: "ellipsis",
		maxWidth: 220,
	};

	const headers: Header<QueueJobWithId>[] = [
		{
			id: "id",
			content: t("common.table.headers.monitorId"),
			render: (row) => (
				<Typography
					fontFamily={theme.typography.fontFamilyMonospace}
					title={String(row.monitorId)}
					sx={cellSx}
				>
					{row.monitorId}
				</Typography>
			),
		},
		{
			id: "url",
			content: t("common.table.headers.url"),
			render: (row) => (
				<Typography title={row.monitorUrl ?? ""} sx={cellSx}>
					{row.monitorUrl}
				</Typography>
			),
		},
		{
			id: "type",
			content: t("common.table.headers.type"),
			render: (row) => <Typography sx={cellSx}>{row.monitorType}</Typography>,
		},
		{
			id: "interval",
			content: t("common.table.headers.interval"),
			render: (row) => (
				<Typography sx={cellSx}>{prettyMilliseconds(row.monitorInterval ?? 0)}</Typography>
			),
		},
		{
			id: "lastRun",
			content: t("pages.logs.table.headers.lastRunAt"),
			render: (row) => {
				const v = formatTimestamp(row.lastRunAt) ?? "-";
				return (
					<Typography title={v} sx={cellSx}>
						{v}
					</Typography>
				);
			},
		},
		{
			id: "lastRunTook",
			content: t("pages.logs.table.headers.lastRunTook"),
			render: (row) => {
				const value = row.lastRunTook ? prettyMilliseconds(row.lastRunTook) : "-";
				return <Typography sx={cellSx}>{value}</Typography>;
			},
		},
		{
			id: "lockedAt",
			content: t("pages.logs.table.headers.lockedAt"),
			render: (row) => {
				const v = formatTimestamp(row.lockedAt) ?? "-";
				return (
					<Typography title={v} sx={cellSx}>
						{v}
					</Typography>
				);
			},
		},
	];

	const isDark = theme.palette.mode === "dark";
	const runningBg = isDark ? "rgba(19, 113, 91, 0.18)" : "#ECF7F2";

	return (
		<Table
			headers={headers}
			data={jobsWithId}
			getRowSx={(row) => ({
				...(row.lockedAt && {
					"& td": { backgroundColor: runningBg },
				}),
			})}
		/>
	);
};

type QueueJobFailureWithId = QueueJobFailure & { id: string | number };

interface TableFailedJobsProps {
	metrics: QueueMetrics | null;
}
export const TableFailedJobs = ({ metrics }: TableFailedJobsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	if (!metrics) {
		return null;
	}

	const jobFailuresWithId: QueueJobFailureWithId[] = metrics.jobsWithFailures.map(
		(job) => ({
			...job,
			id: job.monitorId,
		})
	);

	const headers: Header<QueueJobFailureWithId>[] = [
		{
			id: "monitorId",
			content: t("common.table.headers.monitorId"),
			render: (row) => {
				return (
					<Typography fontFamily={theme.typography.fontFamilyMonospace}>
						{row.monitorId}
					</Typography>
				);
			},
		},
		{
			id: "monitorUrl",
			content: t("common.table.headers.url"),
			render: (row) => {
				return <Typography>{row.monitorUrl}</Typography>;
			},
		},
		{
			id: "failCount",
			content: t("pages.logs.table.headers.failCount"),
			render: (row) => {
				return <Typography>{row.failCount}</Typography>;
			},
		},
		{
			id: "failedAt",
			content: t("pages.logs.table.headers.lastFailedAt"),
			render: (row) => {
				return <Typography>{formatTimestamp(row.failedAt)}</Typography>;
			},
		},
		{
			id: "failReason",
			content: t("pages.logs.table.headers.failReason"),
			render: (row) => {
				return <Typography>{row.failReason}</Typography>;
			},
		},
	];

	return (
		<Table
			headers={headers}
			data={jobFailuresWithId}
		/>
	);
};

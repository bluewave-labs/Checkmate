import { Table } from "@/Components/v2/design-elements";
import { Typography, useTheme } from "@mui/material";
import prettyMilliseconds from "pretty-ms";
import { formatTimestamp } from "@/Utils/TimeUtils";

import { useTranslation } from "react-i18next";
import type { QueueJobFailure, QueueJobSummary, QueueMetrics } from "@/Types/Queue";
import type { Header } from "@/Components/v2/design-elements";

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

	const headers: Header<QueueJobWithId>[] = [
		{
			id: "id",
			content: t("common.table.headers.monitorId"),
			render: (row) => <Typography fontFamily={"monospace"}>{row.monitorId}</Typography>,
		},
		{
			id: "url",
			content: t("common.table.headers.url"),
			render: (row) => <Typography>{row.monitorUrl}</Typography>,
		},
		{
			id: "interval",
			content: t("common.table.headers.interval"),
			render: (row) => (
				<Typography>{prettyMilliseconds(row.monitorInterval ?? 0)}</Typography>
			),
		},
		{
			id: "type",
			content: t("common.table.headers.type"),
			render: (row) => <Typography>{row.monitorType}</Typography>,
		},
		{
			id: "active",
			content: t("common.table.headers.active"),
			render: (row) => <Typography>{row.active.toString()}</Typography>,
		},
		{
			id: "runCount",
			content: t("pages.logs.table.headers.runCount"),
			render: (row) => <Typography>{row.runCount}</Typography>,
		},
		{
			id: "failCount",
			content: t("pages.logs.table.headers.failCount"),
			render: (row) => <Typography>{row.failCount}</Typography>,
		},
		{
			id: "lastRun",
			content: t("pages.logs.table.headers.lastRunAt"),
			render: (row) => <Typography>{formatTimestamp(row.lastRunAt)}</Typography>,
		},
		{
			id: "lockedAt",
			content: t("pages.logs.table.headers.lockedAt"),
			render: (row) => <Typography>{formatTimestamp(row.lockedAt)}</Typography>,
		},

		{
			id: "lastFinish",
			content: t("pages.logs.table.headers.lastFinishedAt"),
			render: (row) => <Typography>{formatTimestamp(row.lastFinishedAt)}</Typography>,
		},
		{
			id: "lastRunTook",
			content: t("pages.logs.table.headers.lastRunTook"),
			render: (row) => {
				const value = row.lastRunTook ? prettyMilliseconds(row.lastRunTook) : "-";
				return <Typography>{value}</Typography>;
			},
		},
	];

	return (
		<Table
			headers={headers}
			data={jobsWithId}
			getRowSx={(row) => ({
				...(row.lockedAt && {
					"& td": { backgroundColor: theme.palette.success.light },
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
				return <Typography fontFamily={"monospace"}>{row.monitorId}</Typography>;
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

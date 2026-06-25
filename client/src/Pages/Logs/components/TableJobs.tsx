import { Table, Pagination } from "@/Components/design-elements";
import { Typography, useTheme } from "@mui/material";
import prettyMilliseconds from "pretty-ms";
import { formatTimestamp } from "@/Utils/TimeUtils";

import { useTranslation } from "react-i18next";
import type { QueueJobFailure, QueueJobSummary, QueueMetrics } from "@/Types/Queue";
import type { Header } from "@/Components/design-elements";
import type { TablePaginationProps } from "@mui/material/TablePagination";

type QueueJobWithId = QueueJobSummary & { id: string | number };

interface TableJobsProps {
	jobs: QueueJobSummary[];
	count: number;
	page: number;
	rowsPerPage: number;
	onPageChange: TablePaginationProps["onPageChange"];
	onRowsPerPageChange: TablePaginationProps["onRowsPerPageChange"];
}

export const TableJobs = ({
	jobs,
	count,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
}: TableJobsProps) => {
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

	const isRunning = (row: QueueJobWithId) =>
		row.lockedBy !== null && row.lockedUntil !== null && row.lockedUntil > Date.now();

	const headers: Header<QueueJobWithId>[] = [
		{
			id: "state",
			content: t("pages.logs.table.headers.state"),
			render: (row) => {
				if (isRunning(row)) {
					return t("common.labels.running");
				}
				if (row.monitorActive === true) {
					return t("common.labels.active");
				}
				if (row.monitorActive === false) {
					return t("common.labels.paused");
				}
				return t("common.labels.idle");
			},
		},
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
			id: "lastFinishedAt",
			content: t("pages.logs.table.headers.lastFinishedAt"),
			render: (row) => {
				const lastFinishedAt = formatTimestamp(row.lastFinishedAt) ?? "-";
				return (
					<Typography
						title={lastFinishedAt}
						sx={cellSx}
					>
						{lastFinishedAt}
					</Typography>
				);
			},
		},
		{
			id: "nextScheduledAt",
			content: t("pages.logs.table.headers.nextScheduledAt"),
			render: (row) => {
				const nextScheduledAt = formatTimestamp(row.nextScheduledAt) ?? "-";
				return (
					<Typography
						title={nextScheduledAt}
						sx={cellSx}
					>
						{nextScheduledAt}
					</Typography>
				);
			},
		},
		{
			id: "lockedBy",
			content: t("pages.logs.table.headers.lockedBy"),
			render: (row) => {
				const lockedBy = row.lockedBy;
				if (!lockedBy) {
					return <Typography sx={cellSx}>-</Typography>;
				}

				const workerId = lockedBy.split(":")[2];
				const shortWorkerId = workerId.slice(workerId.length - 8);
				return (
					<Typography
						title={workerId}
						sx={cellSx}
					>
						{`...${shortWorkerId}`}
					</Typography>
				);
			},
		},
	];

	return (
		<>
			<Table
				headers={headers}
				data={jobsWithId}
				getRowSx={(row) => ({
					...(isRunning(row) && {
						"& td": { backgroundColor: theme.palette.rowStatus.running },
					}),
					...(row.monitorActive === false && {
						"& td": { backgroundColor: theme.palette.rowStatus.paused },
					}),
				})}
			/>
			<Pagination
				component="div"
				count={count}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={onPageChange}
				onRowsPerPageChange={onRowsPerPageChange}
				itemsOnPage={jobs.length}
			/>
		</>
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

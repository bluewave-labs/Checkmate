import { Table } from "@/Components/design-elements";
import { Typography, useTheme } from "@mui/material";
import { formatTimestamp } from "@/Utils/TimeUtils";

import { useTranslation } from "react-i18next";
import type { QueueWorker } from "@/Types/Queue";
import type { Header } from "@/Components/design-elements";

type QueueWorkerWithId = QueueWorker & { id: number };

interface TableWorkersProps {
	queueWorkers: QueueWorkerWithId[];
}

export const TableWorkers = ({ queueWorkers }: TableWorkersProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const cellSx = {
		whiteSpace: "nowrap" as const,
		overflow: "hidden",
		textOverflow: "ellipsis",
		maxWidth: 220,
	};

	const headers: Header<QueueWorkerWithId>[] = [
		{
			id: "host",
			content: t("pages.logs.table.headers.host"),
			render: (row) => {
				const host = row.workerId.split(":")[0];
				return (
					<Typography
						fontFamily={theme.typography.fontFamilyMonospace}
						sx={cellSx}
					>
						{host}
					</Typography>
				);
			},
		},
		{
			id: "processId",
			content: t("pages.logs.table.headers.processId"),
			render: (row) => {
				const processId = row.workerId.split(":")[1];
				return (
					<Typography
						fontFamily={theme.typography.fontFamilyMonospace}
						sx={cellSx}
					>
						{processId}
					</Typography>
				);
			},
		},
		{
			id: "id",
			content: t("pages.logs.table.headers.workerId"),
			render: (row) => {
				const workerId = row.workerId.split(":")[2];
				const shortWorkerId = workerId.slice(workerId.length - 8);
				return (
					<Typography
						fontFamily={theme.typography.fontFamilyMonospace}
						title={workerId}
						sx={cellSx}
					>
						{`...${shortWorkerId}`}
					</Typography>
				);
			},
		},
		{
			id: "mode",
			content: t("pages.logs.table.headers.workerMode"),
			render: (row) => <Typography sx={cellSx}>{row.mode}</Typography>,
		},
		{
			id: "lastSeen",
			content: t("pages.logs.table.headers.lastSeenAt"),
			render: (row) => (
				<Typography sx={cellSx}>{formatTimestamp(row.lastSeenAt)}</Typography>
			),
		},
	];

	return (
		<Table
			headers={headers}
			data={queueWorkers}
		/>
	);
};

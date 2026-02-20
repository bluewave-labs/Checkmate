import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Table } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import { useTheme } from "@mui/material";
import type { Header } from "@/Components/design-elements/Table";
import type { Log, LogLevel } from "@/Types/Log";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/Types/state";
import { setRowsPerPage } from "@/Features/UI/uiSlice";
import { formatTimestamp } from "@/Utils/TimeUtils";

type LogWithId = Log & { id: number };

interface TableLogsProps {
	logs: LogWithId[];
	logCount: number;
	page: number;
	setPage: (page: number) => void;
}

const LevelBadge = ({ level }: { level: LogLevel }) => {
	const theme = useTheme();

	const levelColors: Record<LogLevel, string> = {
		info: theme.palette.success.main,
		warn: theme.palette.warning.main,
		error: theme.palette.error.main,
		debug: theme.palette.info.main,
	};

	const color = levelColors[level] || theme.palette.text.primary;

	return (
		<Typography
			fontWeight={600}
			color={color}
			textTransform={"uppercase"}
		>
			{level}
		</Typography>
	);
};

export const TableLogs = ({ logs, logCount, page, setPage }: TableLogsProps) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const rowsPerPage = useSelector(
		(state: RootState) => state?.ui?.logs?.rowsPerPage ?? 15
	);

	const headers: Header<Log & { id: number }>[] = [
		{
			id: "timestamp",
			content: t("pages.logs.table.headers.timestamp"),
			render: (row) => (
				<Typography sx={{ fontFamily: "monospace" }}>
					{formatTimestamp(row.timestamp)}
				</Typography>
			),
		},
		{
			id: "level",
			content: t("pages.logs.table.headers.level"),
			render: (row) => <LevelBadge level={row.level} />,
		},
		{
			id: "service",
			content: t("pages.logs.table.headers.service"),
			render: (row) => <Typography>{row.service || "-"}</Typography>,
		},
		{
			id: "method",
			content: t("pages.logs.table.headers.method"),
			render: (row) => (
				<Typography fontFamily={"monospace"}>{row.method || "-"}</Typography>
			),
		},
		{
			id: "message",
			content: t("common.table.headers.message"),
			render: (row) => (
				<Typography
					maxWidth={400}
					overflow={"hidden"}
					textOverflow={"ellipsis"}
					whiteSpace={"nowrap"}
				>
					{row.message || "-"}
				</Typography>
			),
		},
	];

	const handlePageChange = (
		_e: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
	) => {
		dispatch(setRowsPerPage({ value: Number(e.target.value), table: "logs" }));
		setPage(0);
	};

	return (
		<Box>
			<Table
				headers={headers}
				data={logs}
				emptyViewText={t("pages.logs.noLogs")}
			/>
			<Pagination
				itemsOnPage={logs.length}
				component="div"
				count={logCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
			/>
		</Box>
	);
};

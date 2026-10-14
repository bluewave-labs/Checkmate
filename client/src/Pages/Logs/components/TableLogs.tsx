import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Table } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import { useTheme } from "@mui/material";
import type { Header } from "@/Components/design-elements/Table";
import type { Log, LogError, LogLevel } from "@/Types/Log";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/Types/state";
import { setRowsPerPage } from "@/Features/UI/uiSlice";
import { useFormatDate } from "@/Hooks/useFormatDate";

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

// Stack (or name: message) of the error, then each cause beneath it, matching the server's console format
const formatError = (error: LogError): string => {
	const head = error.stack ?? `${error.name}: ${error.message}`;
	return error.cause ? `${head}\nCaused by: ${formatError(error.cause)}` : head;
};

const hasEntryDetails = (log: Log) => Boolean(log.error || log.details || log.context);

const EntrySection = ({ label, value }: { label: string; value: string }) => {
	const theme = useTheme();
	return (
		<Stack gap={theme.spacing(SPACING.SM)}>
			<Typography
				fontWeight={600}
				color={theme.palette.text.primary}
			>
				{label}
			</Typography>
			<Box
				component="pre"
				m={0}
				p={theme.spacing(SPACING.LG)}
				borderRadius={theme.shape.borderRadius}
				bgcolor={theme.palette.action.hover}
				fontFamily={theme.typography.fontFamilyMonospace}
				whiteSpace="pre-wrap"
				sx={{ overflowWrap: "anywhere" }}
			>
				{value}
			</Box>
		</Stack>
	);
};

const LogEntryDetails = ({ log }: { log: Log }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			gap={theme.spacing(LAYOUT.XS)}
			textAlign="left"
		>
			{log.error && (
				<EntrySection
					label={t("pages.logs.entry.error")}
					value={formatError(log.error)}
				/>
			)}
			{log.error?.details && (
				<EntrySection
					label={t("pages.logs.entry.errorDetails")}
					value={JSON.stringify(log.error.details, null, 2)}
				/>
			)}
			{log.details && (
				<EntrySection
					label={t("pages.logs.entry.details")}
					value={JSON.stringify(log.details, null, 2)}
				/>
			)}
			{log.context && (
				<EntrySection
					label={t("pages.logs.entry.context")}
					value={JSON.stringify(log.context, null, 2)}
				/>
			)}
		</Stack>
	);
};

export const TableLogs = ({ logs, logCount, page, setPage }: TableLogsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const formatDate = useFormatDate();
	const dispatch = useDispatch();
	const rowsPerPage = useSelector(
		(state: RootState) => state?.ui?.logs?.rowsPerPage ?? 15
	);

	const headers: Header<Log & { id: number }>[] = [
		{
			id: "timestamp",
			content: t("pages.logs.table.headers.timestamp"),
			render: (row) => (
				<Typography sx={{ fontFamily: theme.typography.fontFamilyMonospace }}>
					{formatDate(row.timestamp, "dateTimeSeconds")}
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
				<Typography fontFamily={theme.typography.fontFamilyMonospace}>
					{row.method || "-"}
				</Typography>
			),
		},
		{
			id: "message",
			content: t("common.table.headers.message"),
			render: (row) => (
				<Stack maxWidth={400}>
					<Typography
						overflow={"hidden"}
						textOverflow={"ellipsis"}
						whiteSpace={"nowrap"}
					>
						{row.message || "-"}
					</Typography>
					{row.error && (
						<Typography
							color={theme.palette.error.main}
							overflow={"hidden"}
							textOverflow={"ellipsis"}
							whiteSpace={"nowrap"}
						>
							{row.error.message || row.error.name}
						</Typography>
					)}
				</Stack>
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
				expandableRows
				renderExpandedContent={(row) => (hasEntryDetails(row) ? <LogEntryDetails log={row} /> : null)}
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

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Select from "@/Components/v1/Inputs/Select/index.jsx";
import Typography from "@mui/material/Typography";
import DataTable from "@/Components/v1/Table/index.jsx";
import Pagination from "@/Components/v1/Table/TablePagination/index.jsx";

import { useFetchLogs } from "../../../Hooks/logHooks.js";
import { useTheme } from "@emotion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const LevelBadge = ({ level }) => {
	const theme = useTheme();

	const levelColors = {
		info: theme.palette.success.main,
		warn: theme.palette.warning.main,
		error: theme.palette.error.main,
		debug: theme.palette.accent.main,
	};

	const color = levelColors[level] || theme.palette.primary.contrastText;

	return (
		<Box
			component="span"
			sx={{
				color: color,
				fontWeight: 600,
				textTransform: "uppercase",
				fontSize: 12,
			}}
		>
			{level}
		</Box>
	);
};

const formatTimestamp = (timestamp) => {
	if (!timestamp) return "-";
	const date = new Date(timestamp);
	return date.toLocaleString();
};

const Logs = () => {
	const [logLevel, setLogLevel] = useState("all");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(15);

	const theme = useTheme();
	const { t } = useTranslation();
	const [logs, isLoading, error] = useFetchLogs();

	const LOG_LEVELS = [
		{ _id: "all", name: t("logsPage.logLevelSelect.values.all") },
		{ _id: "info", name: t("logsPage.logLevelSelect.values.info") },
		{ _id: "warn", name: t("logsPage.logLevelSelect.values.warn") },
		{ _id: "error", name: t("logsPage.logLevelSelect.values.error") },
		{ _id: "debug", name: t("logsPage.logLevelSelect.values.debug") },
	];

	const headers = [
		{
			id: "timestamp",
			content: t("logsPage.table.timestamp"),
			render: (row) => (
				<Typography sx={{ fontSize: 13, fontFamily: "monospace" }}>
					{formatTimestamp(row.timestamp)}
				</Typography>
			),
		},
		{
			id: "level",
			content: t("logsPage.table.level"),
			render: (row) => <LevelBadge level={row.level} />,
		},
		{
			id: "service",
			content: t("logsPage.table.service"),
			render: (row) => (
				<Typography sx={{ fontSize: 13 }}>{row.service || "-"}</Typography>
			),
		},
		{
			id: "method",
			content: t("logsPage.table.method"),
			render: (row) => (
				<Typography sx={{ fontSize: 13, fontFamily: "monospace" }}>{row.method || "-"}</Typography>
			),
		},
		{
			id: "message",
			content: t("logsPage.table.message"),
			render: (row) => (
				<Typography
					sx={{
						fontSize: 13,
						maxWidth: 400,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{row.message || "-"}
				</Typography>
			),
		},
	];

	const filteredLogs = logs
		?.filter((log) => {
			if (logLevel === "all") return true;
			return log.level === logLevel;
		})
		.reverse()
		.map((log, idx) => ({ ...log, id: idx }));

	const paginatedLogs = filteredLogs?.slice(
		page * rowsPerPage,
		page * rowsPerPage + rowsPerPage
	);

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleLogLevelChange = (e) => {
		setLogLevel(e.target.value);
		setPage(0);
	};

	return (
		<Stack gap={theme.spacing(4)}>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(4)}
			>
				<Typography>{t("logsPage.logLevelSelect.title")}</Typography>
				<Select
					items={LOG_LEVELS}
					value={logLevel}
					onChange={handleLogLevelChange}
				/>
			</Stack>

			<DataTable
				shouldRender={!isLoading}
				headers={headers}
				data={paginatedLogs || []}
				config={{
					emptyView: t("logsPage.noLogs"),
				}}
			/>

			{filteredLogs?.length > 0 && (
				<Pagination
					paginationLabel={t("logsPage.table.logs")}
					itemCount={filteredLogs?.length || 0}
					page={page}
					rowsPerPage={rowsPerPage}
					handleChangePage={handleChangePage}
					handleChangeRowsPerPage={handleChangeRowsPerPage}
				/>
			)}
		</Stack>
	);
};

export default Logs;

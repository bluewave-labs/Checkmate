import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useSelector } from "react-redux";
import { Select } from "@/Components/v2/inputs";
import { TableLogs } from "./TableLogs";

import { useTheme } from "@mui/material";
import { useGet } from "@/Hooks/UseApi";
import { useState } from "react";
import type { Log, LogLevelOption } from "@/Types/Log";
import { LOG_LEVEL_OPTIONS } from "@/Types/Log";
import { t } from "i18next";
import type { RootState } from "@/Types/state";

export const TabLogs = () => {
	const theme = useTheme();
	const { data: logs } = useGet<Log[]>("/logs");
	const [selectedLogLevel, setSelectedLogLevel] = useState<LogLevelOption>("all");
	const [page, setPage] = useState(0);
	const rowsPerPage = useSelector(
		(state: RootState) => state?.ui?.logs?.rowsPerPage ?? 15
	);

	const filteredLogs = logs
		?.filter((log) => {
			if (selectedLogLevel === "all") return true;
			return log.level === selectedLogLevel;
		})
		.reverse()
		.map((log, idx) => ({ ...log, id: idx }));

	const paginatedLogs =
		filteredLogs?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) ?? [];

	return (
		<Stack gap={theme.spacing(8)}>
			<Select
				sx={{ maxWidth: 200 }}
				fieldLabel={t("pages.logs.logLevelSelect.label")}
				value={selectedLogLevel}
				onChange={(e) => setSelectedLogLevel(e.target.value)}
			>
				{LOG_LEVEL_OPTIONS.map((level) => {
					return (
						<MenuItem
							key={level}
							value={level}
						>
							<Typography textTransform={"capitalize"}>{level}</Typography>
						</MenuItem>
					);
				})}
			</Select>
			<TableLogs
				logs={paginatedLogs}
				logCount={filteredLogs?.length ?? 0}
				page={page}
				setPage={setPage}
			/>
		</Stack>
	);
};

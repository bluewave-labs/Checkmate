import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Select from "../../../Components/Inputs/Select";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import { useFetchLogs } from "../../../Hooks/logHooks";
import { useTheme } from "@emotion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const formatLog = (theme, log, idx) => {
	const levelColors = {
		info: theme.palette.success.main,
		warn: theme.palette.warning.main,
		error: theme.palette.error.main,
		debug: theme.palette.accent.main,
	};

	const color = levelColors[log.level] || theme.palette.primary.contrastText;

	return (
		<span key={idx}>
			<span>[{log.timestamp}]</span>{" "}
			<span style={{ color, fontWeight: "bold" }}>{log.level.toUpperCase()}</span>
			{": "}
			{`(${log.service})`}
			{`(${log.method})`}
			{": "}
			{log.message}
			<br />
		</span>
	);
};

const Logs = () => {
	// Local state
	const [logLevel, setLogLevel] = useState("all");

	// Hooks
	const theme = useTheme();
	const { t } = useTranslation();
	const [logs, isLoading, error] = useFetchLogs();
	// Setup
	const LOG_LEVELS = [
		{ _id: "all", name: t("logsPage.logLevelSelect.values.all") },
		{ _id: "info", name: t("logsPage.logLevelSelect.values.info") },
		{ _id: "warn", name: t("logsPage.logLevelSelect.values.warn") },
		{ _id: "error", name: t("logsPage.logLevelSelect.values.error") },
		{ _id: "debug", name: t("logsPage.logLevelSelect.values.debug") },
	];
	return (
		<Stack gap={theme.spacing(8)}>
			<Stack
				gap={theme.spacing(8)}
				sx={{
					position: "sticky",
					top: theme.spacing(19),
					zIndex: 950,
					backgroundColor: theme.palette.primary.main,
					paddingY: theme.spacing(7),
					paddingX: theme.spacing(7),
				}}
			>
				<Typography variant="h2">{t("logsPage.description")}</Typography>
				<Divider color={theme.palette.accent.main} />
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(4)}
				>
					<Typography>{t("logsPage.logLevelSelect.title")}</Typography>
					<Select
						items={LOG_LEVELS}
						value={logLevel}
						onChange={(e) => setLogLevel(e.target.value)}
					/>
				</Stack>
			</Stack>

			<Box
				component="pre"
				sx={{
					fontFamily: "monospace",
					color: theme.palette.primary.contrastText,
					padding: 2,
					borderRadius: 1,
					overflowX: "auto",
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
				}}
			>
				<code>
					{logs
						?.filter((log) => {
							if (logLevel === "all") return true;
							return log.level === logLevel;
						})
						.reverse()
						.map((log, idx) => formatLog(theme, log, idx))}
				</code>
			</Box>
		</Stack>
	);
};

export default Logs;

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Chip,
	Collapse,
	IconButton,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
	useTheme,
} from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BasePage } from "@/Components/design-elements";
import ScriptOutputCard from "@/Components/monitors/ScriptOutputCard";
import DatapointChart from "@/Components/monitors/DatapointChart";
import { useGet } from "@/Hooks/UseApi";
import type { Check } from "@/Types/Check";
import type { Monitor } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";

interface ScriptMonitorDetailsResponse {
	monitor: Monitor;
	checks: Check[];
	summary: {
		totalChecks: number;
		upChecks: number;
		downChecks: number;
		uptimePercentage: number;
	};
	monitorStats: unknown;
}

interface ParsedMessage {
	parsedStatus?: string;
	parsedMessage?: string;
	severity?: string;
	exitCode?: number;
	executionTimeMs?: number;
	datapoints?: Array<{ name: string; value: number; unit?: string }>;
}

const parseMessage = (check: Check): ParsedMessage => {
	if (!check.message) return {};
	try {
		return JSON.parse(check.message) as ParsedMessage;
	} catch {
		return {};
	}
};

const severityColour = (severity: string | undefined, fallback: string): string => {
	switch (severity) {
		case "success":
			return fallback;
		case "info":
			return "#3b82f6";
		case "warning":
			return "#f59e0b";
		case "error":
			return "#ef4444";
		case "critical":
			return "#b91c1c";
		default:
			return fallback;
	}
};

interface ScriptMonitorDetailsProps {
	monitorId: string;
	monitor?: Monitor;
}

const ScriptMonitorDetails = ({
	monitorId,
	monitor: monitorProp,
}: ScriptMonitorDetailsProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [expandedRow, setExpandedRow] = useState<string | null>(null);

	const { data: detailsData, isLoading } = useGet<ScriptMonitorDetailsResponse>(
		`/monitors/uptime/details/${monitorId}?dateRange=all`
	);
	const { data: checksData } = useGet<{ checks: Check[]; checksCount: number }>(
		`/checks?monitorId=${monitorId}&limit=100&sortOrder=desc`
	);

	const monitor = detailsData?.monitor ?? monitorProp;
	const checks = useMemo(
		() => checksData?.checks ?? detailsData?.checks ?? [],
		[checksData, detailsData]
	);
	const latestCheck = checks[0];
	const latestParsed = latestCheck ? parseMessage(latestCheck) : {};

	const datapointSeries = useMemo(() => {
		const series: Record<
			string,
			{ unit?: string; data: Array<{ t: string; v: number }> }
		> = {};
		// Walk oldest-to-newest so the chart x-axis ticks ascend in time.
		for (let i = checks.length - 1; i >= 0; i--) {
			const c = checks[i];
			const parsed = parseMessage(c);
			for (const dp of parsed.datapoints ?? []) {
				if (!series[dp.name]) {
					series[dp.name] = { unit: dp.unit, data: [] };
				}
				series[dp.name].data.push({ t: c.createdAt, v: dp.value });
			}
		}
		return series;
	}, [checks]);

	const paginatedChecks = useMemo(() => {
		const start = page * rowsPerPage;
		return checks.slice(start, start + rowsPerPage);
	}, [checks, page, rowsPerPage]);

	const bannerColour = useMemo(() => {
		if (!latestCheck) return theme.palette.background.paper;
		return severityColour(latestParsed.severity, theme.palette.success.main);
	}, [
		latestCheck,
		latestParsed.severity,
		theme.palette.background.paper,
		theme.palette.success.main,
	]);

	if (isLoading) {
		return <BasePage loading={true}>{null}</BasePage>;
	}

	return (
		<BasePage>
			<Box
				p={theme.spacing(LAYOUT.LG)}
				borderRadius={theme.shape.borderRadius}
				bgcolor={bannerColour}
				color="#fff"
			>
				<Typography
					variant="h5"
					color="inherit"
				>
					{monitor?.name ?? t("pages.scriptMonitor.details.unknown", "Script monitor")}
				</Typography>
				<Typography
					variant="body1"
					color="inherit"
				>
					{t("pages.scriptMonitor.details.statusBanner", "Status")}:{" "}
					{monitor?.status ?? "—"}
				</Typography>
				{latestParsed.parsedMessage && (
					<Typography
						variant="body2"
						color="inherit"
					>
						{latestParsed.parsedMessage}
					</Typography>
				)}
				{latestCheck && (
					<Typography
						variant="body2"
						color="inherit"
					>
						{t("pages.scriptMonitor.details.lastCheck", "Last check")}:{" "}
						{new Date(latestCheck.createdAt).toLocaleString()}
					</Typography>
				)}
			</Box>

			<Stack>
				<Typography variant="h5">
					{t("pages.scriptMonitor.details.lastExecution", "Last execution")}
				</Typography>
				<ScriptOutputCard checkMessage={latestCheck?.message} />
			</Stack>

			{Object.keys(datapointSeries).length > 0 && (
				<Stack spacing={theme.spacing(LAYOUT.MD)}>
					<Typography variant="h5">
						{t("pages.scriptMonitor.details.datapoints", "Datapoints")}
					</Typography>
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						{Object.entries(datapointSeries).map(([name, series]) => (
							<DatapointChart
								key={name}
								name={name}
								unit={series.unit}
								data={series.data}
							/>
						))}
					</Stack>
				</Stack>
			)}

			<Stack spacing={theme.spacing(LAYOUT.MD)}>
				<Typography variant="h5">
					{t("pages.scriptMonitor.details.executionHistory", "Execution history")}
				</Typography>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell width={32} />
								<TableCell>
									{t("pages.scriptMonitor.details.columnTime", "Time")}
								</TableCell>
								<TableCell>
									{t("pages.scriptMonitor.details.columnStatus", "Status")}
								</TableCell>
								<TableCell>
									{t("pages.scriptMonitor.details.columnMessage", "Message")}
								</TableCell>
								<TableCell>
									{t("pages.scriptMonitor.details.columnExit", "Exit")}
								</TableCell>
								<TableCell>
									{t("pages.scriptMonitor.details.columnDuration", "Duration")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paginatedChecks.map((check) => {
								const parsed = parseMessage(check);
								const open = expandedRow === check.id;
								const previewMessage = parsed.parsedMessage ?? "";
								const truncated =
									previewMessage.length > 80
										? `${previewMessage.slice(0, 80)}…`
										: previewMessage;
								return [
									<TableRow
										key={check.id}
										hover
									>
										<TableCell>
											<IconButton
												size="small"
												onClick={() => setExpandedRow(open ? null : check.id)}
												aria-label={t("common.actions.expand", "Expand") as string}
											>
												{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
											</IconButton>
										</TableCell>
										<TableCell>{new Date(check.createdAt).toLocaleString()}</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={parsed.parsedStatus ?? (check.status ? "up" : "down")}
												sx={{
													backgroundColor: severityColour(
														parsed.severity,
														check.status
															? theme.palette.success.main
															: theme.palette.error.main
													),
													color: "#fff",
												}}
											/>
										</TableCell>
										<TableCell>{truncated || "—"}</TableCell>
										<TableCell>{parsed.exitCode ?? "—"}</TableCell>
										<TableCell>
											{parsed.executionTimeMs ?? check.responseTime ?? 0} ms
										</TableCell>
									</TableRow>,
									<TableRow key={`${check.id}-detail`}>
										<TableCell
											colSpan={6}
											sx={{ p: 0, borderBottom: 0 }}
										>
											<Collapse
												in={open}
												unmountOnExit
											>
												<Box p={theme.spacing(LAYOUT.SM)}>
													<ScriptOutputCard checkMessage={check.message} />
												</Box>
											</Collapse>
										</TableCell>
									</TableRow>,
								];
							})}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					component="div"
					count={checks.length}
					page={page}
					onPageChange={(_, newPage) => setPage(newPage)}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={(e) => {
						setRowsPerPage(parseInt(e.target.value, 10));
						setPage(0);
					}}
					rowsPerPageOptions={[10, 25, 50]}
					SelectProps={{
						renderValue: (value) => (
							<MenuItem
								value={value as number}
								sx={{ p: 0 }}
							>
								{value as number}
							</MenuItem>
						),
					}}
				/>
			</Stack>
		</BasePage>
	);
};

export default ScriptMonitorDetails;

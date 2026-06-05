import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { TableJobs, TableFailedJobs } from "./components/TableJobs";
import { TableWorkers } from "./components/TableWorkers";
import { useTheme } from "@mui/material";
import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useGet, usePost } from "@/Hooks/UseApi";
import type { QueueData } from "@/Types/Queue";
import { Metrics } from "@/Pages/Logs/components/Metrics";
import { Button } from "@/Components/inputs";
import { EmptyState } from "@/Components/design-elements";
import { SPACING } from "@/Utils/Theme/constants";

export const TabQueue = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const {
		data: queueData,
		isLoading,
		// error,
		refetch,
	} = useGet<QueueData>(
		`/queue/all-metrics?page=${page}&rowsPerPage=${rowsPerPage}`,
		{},
		{ refreshInterval: 1000, keepPreviousData: true }
	);

	const { post, loading: isFlushing } = usePost();

	const jobs = queueData?.jobs ?? [];
	const jobsCount = queueData?.count ?? 0;
	const workers = (queueData?.metrics?.workers ?? []).map((worker, idx) => ({
		...worker,
		id: idx,
	}));
	const metrics = queueData?.metrics ?? null;
	const hasNeverRun = !isLoading && metrics !== null && (metrics.totalRuns ?? 0) === 0;
	const noQueueData = !isLoading && metrics === null && jobs.length === 0;
	if (hasNeverRun || noQueueData) {
		return (
			<EmptyState
				fullscreen
				title={t("pages.logs.queueFallback.title")}
				description={t("pages.logs.queueFallback.description")}
			/>
		);
	}

	const handleFlushQueue = async () => {
		await post("/queue/flush", {});
		refetch();
	};

	return (
		<Stack gap={theme.spacing(16)}>
			<Metrics metrics={metrics} />
			<Stack gap={theme.spacing(3)}>
				<Stack gap={theme.spacing(1)}>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
					>
						{t("pages.logs.workers")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						<Trans
							i18nKey="pages.logs.workersExplainers"
							components={{
								highlight: (
									<Box
										component="span"
										bgcolor={theme.palette.rowStatus.running}
										color={theme.palette.text.primary}
										px={SPACING.SM}
										py={SPACING.XXS}
										borderRadius={theme.shape.borderRadius}
									/>
								),
							}}
						/>
					</Typography>
				</Stack>
				<TableWorkers queueWorkers={workers} />
			</Stack>
			<Stack gap={theme.spacing(3)}>
				<Stack gap={theme.spacing(1)}>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
					>
						{t("pages.logs.jobQueue")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						<Trans
							i18nKey="pages.logs.jobQueueExplainer"
							components={{
								highlight: (
									<Box
										component="span"
										bgcolor={theme.palette.rowStatus.running}
										color={theme.palette.text.primary}
										px={SPACING.SM}
										py={SPACING.XXS}
										borderRadius={theme.shape.borderRadius}
									/>
								),
							}}
						/>
					</Typography>
				</Stack>
				<TableJobs
					jobs={jobs}
					count={jobsCount}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={(_, newPage) => setPage(newPage)}
					onRowsPerPageChange={(event) => {
						setRowsPerPage(parseInt(event.target.value, 10));
						setPage(0);
					}}
				/>
			</Stack>
			<Stack gap={theme.spacing(3)}>
				<Stack gap={theme.spacing(1)}>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
					>
						{t("pages.logs.failedJobs")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.failedJobsExplainer")}
					</Typography>
				</Stack>
				<TableFailedJobs metrics={metrics} />
			</Stack>
			<Stack alignItems={"flex-end"}>
				<Button
					variant="contained"
					onClick={handleFlushQueue}
					loading={isFlushing}
				>
					{t("common.buttons.flushQueue")}
				</Button>
			</Stack>
		</Stack>
	);
};

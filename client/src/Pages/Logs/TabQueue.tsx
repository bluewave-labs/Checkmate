import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { TableJobs, TableFailedJobs } from "./components/TableJobs";

import { useTheme } from "@mui/material";
import { useTranslation, Trans } from "react-i18next";
import { useGet, usePost } from "@/Hooks/UseApi";
import type { QueueData } from "@/Types/Queue";
import { Metrics } from "@/Pages/Logs/components/Metrics";
import { Button } from "@/Components/inputs";
import { EmptyState } from "@/Components/design-elements";

export const TabQueue = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const {
		data: queueData,
		isLoading,
		// error,
		refetch,
	} = useGet<QueueData>("/queue/all-metrics", {}, { refreshInterval: 1000 });

	const { post, loading: isFlushing } = usePost();

	const jobs = queueData?.jobs ?? [];
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
						color="text.secondary"
					>
						{t("pages.logs.jobQueue")}
					</Typography>
					<Typography
						sx={{
							fontSize: 13,
							color: theme.palette.text.secondary,
						}}
					>
						<Trans
							i18nKey="pages.logs.jobQueueExplainer"
							components={{
								highlight: (
									<Box
										component="span"
										sx={{
											backgroundColor:
												theme.palette.mode === "dark"
													? "rgba(19, 113, 91, 0.18)"
													: "#ECF7F2",
											color: theme.palette.text.primary,
											px: 1,
											py: 0.25,
											borderRadius: 0.5,
										}}
									/>
								),
							}}
						/>
					</Typography>
				</Stack>
				<TableJobs jobs={jobs} />
			</Stack>
			<Stack gap={theme.spacing(3)}>
				<Stack gap={theme.spacing(1)}>
					<Typography
						variant="eyebrow"
						color="text.secondary"
					>
						{t("pages.logs.failedJobs")}
					</Typography>
					<Typography
						sx={{
							fontSize: 13,
							color: theme.palette.text.secondary,
						}}
					>
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

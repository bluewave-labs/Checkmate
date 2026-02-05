import Stack from "@mui/material/Stack";
import { TableJobs, TableFailedJobs } from "@/Pages/Logs/TableJobs";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useGet, usePost } from "@/Hooks/UseApi";
import type { QueueData } from "@/Types/Queue";
import { Metrics } from "@/Pages/Logs/Metrics";
import { Button } from "@/Components/v2/inputs";

export const TabQueue = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const {
		data: queueData,
		// isLoading,
		// error,
		refetch,
	} = useGet<QueueData>("/queue/all-metrics", {}, { refreshInterval: 5000 });

	const { post, loading: isFlushing } = usePost();

	const jobs = queueData?.jobs ?? [];
	const metrics = queueData?.metrics ?? null;

	const handleFlushQueue = async () => {
		await post("/queue/flush", {});
		refetch();
	};

	return (
		<Stack gap={theme.spacing(8)}>
			<Metrics metrics={metrics} />
			<TableJobs jobs={jobs} />
			<TableFailedJobs metrics={metrics} />
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

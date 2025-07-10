// Components
import Stack from "@mui/material/Stack";
import JobTable from "./components/JobTable";
import Metrics from "./components/Metrics";
import FailedJobTable from "./components/FailedJobTable";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";

// Utils
import { useState } from "react";
import { useFetchQueueData, useFlushQueue } from "../../../Hooks/logHooks";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";

const QueueDetails = () => {
	// Local state
	const [trigger, setTrigger] = useState(false);

	// Hooks
	const { t } = useTranslation();
	const theme = useTheme();
	const [jobs, metrics, isLoading, error] = useFetchQueueData(trigger);
	const [flushQueue, isFlushing, flushError] = useFlushQueue();

	if (isLoading) return <div>Loading...</div>;
	if (error || flushError) return <div>Error: {error.message}</div>;

	return (
		<Stack gap={theme.spacing(20)}>
			<Metrics metrics={metrics} />
			<JobTable jobs={jobs} />
			<FailedJobTable metrics={metrics} />

			<ButtonGroup
				variant="contained"
				color="accent"
				sx={{
					position: "sticky",
					bottom: 0,
					zIndex: 1000,
					backgroundColor: theme.palette.primary.main,
					p: theme.spacing(4),
					border: `1px solid ${theme.palette.primary.lowContrast}`,
					borderRadius: theme.spacing(2),
				}}
			>
				<Button
					onClick={() => {
						setTrigger(!trigger);
					}}
					loading={isLoading}
				>
					{t("queuePage.refreshButton")}
				</Button>
				<Button
					onClick={() => flushQueue(trigger, setTrigger)}
					loading={isFlushing}
				>
					{t("queuePage.flushButton")}
				</Button>
			</ButtonGroup>
		</Stack>
	);
};

export default QueueDetails;

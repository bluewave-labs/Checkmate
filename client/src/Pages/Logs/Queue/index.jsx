// Components
import Stack from "@mui/material/Stack";
import JobTable from "./components/JobTable";
import Metrics from "./components/Metrics";
import FailedJobTable from "./components/FailedJobTable";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

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
		<Stack gap={theme.spacing(4)}>
			<Typography variant="h2">{t("queuePage.metricsTable.title")}</Typography>
			<Divider color={theme.palette.accent.main} />
			<Stack
				gap={theme.spacing(20)}
				mt={theme.spacing(10)}
			>
				<Metrics metrics={metrics} />
				<JobTable jobs={jobs} />
				<FailedJobTable metrics={metrics} />

				<Stack
					direction="row"
					justifyContent="flex-end"
					sx={{
						position: "sticky",
						bottom: 0,
						boxShadow: theme.shape.boxShadow,
						zIndex: 1000,
						mt: 3,
						backgroundColor: theme.palette.primary.main,
						display: "flex",
						justifyContent: "flex-end",
						pb: theme.spacing(4),
						pr: theme.spacing(15),
						pl: theme.spacing(5),
						pt: theme.spacing(4),
						border: 1,
						borderStyle: "solid",
						borderColor: theme.palette.primary.lowContrast,
						borderRadius: theme.spacing(2),
					}}
				>
					<ButtonGroup
						variant="contained"
						color="accent"
					>
					<Button
						onClick={() => {
							setTrigger(!trigger);
						}}
						loading={isLoading}
						sx={{ px: theme.spacing(12), py: theme.spacing(8) }}
					>
						{t("queuePage.refreshButton")}
					</Button>
					<Button
						onClick={() => flushQueue(trigger, setTrigger)}
						loading={isFlushing}
						sx={{ px: theme.spacing(12), py: theme.spacing(8) }}
					>
						{t("queuePage.flushButton")}
					</Button>
					</ButtonGroup>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default QueueDetails;

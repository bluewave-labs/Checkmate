import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Gauges from "./components/gauges";
import Button from "@mui/material/Button";
import StatBox from "../../../Components/StatBox";
import StatusBoxes from "../../../Components/StatusBoxes";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useFetchDiagnostics } from "../../../Hooks/logHooks";
import { getHumanReadableDuration } from "../../../Utils/timeUtils";
import { formatBytes, getPercentage } from "./utils/utils";

const Diagnostics = () => {
	// Local state

	// Hooks
	const theme = useTheme();
	const { t } = useTranslation();
	const [diagnostics, fetchDiagnostics, isLoading, error] = useFetchDiagnostics();
	// Setup
	return (
		<Stack gap={theme.spacing(10)}>
			<StatusBoxes flexWrap="wrap">
				<StatBox
					gradient={true}
					status="up"
					heading={t("status")}
					subHeading={
						error 
							? t("logsPage.logLevelSelect.values.error")
							: isLoading 
								? t("commonSaving")
								: diagnostics 
									? t("diagnosticsPage.diagnosticDescription") 
									: t("general.noOptionsFound", { unit: "data" })
					}
				/>
				<StatBox
					heading={t("diagnosticsPage.stats.eventLoopDelayTitle")}
					subHeading={getHumanReadableDuration(diagnostics?.eventLoopDelayMs)}
				/>
				<StatBox
					heading={t("diagnosticsPage.stats.uptimeTitle")}
					subHeading={getHumanReadableDuration(diagnostics?.uptimeMs)}
				/>
				<StatBox
					heading={t("diagnosticsPage.stats.usedHeapSizeTitle")}
					subHeading={formatBytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
				/>
				<StatBox
					heading={t("diagnosticsPage.stats.totalHeapSizeTitle")}
					subHeading={formatBytes(diagnostics?.v8HeapStats?.totalHeapSizeBytes)}
				/>
				<StatBox
					heading={t("diagnosticsPage.stats.osMemoryLimitTitle")}
					subHeading={formatBytes(diagnostics?.osStats?.totalMemoryBytes)}
				/>
			</StatusBoxes>
			<Gauges
				diagnostics={diagnostics}
				isLoading={isLoading}
			/>
			<Box>
				<Button
					variant="contained"
					color="accent"
					onClick={fetchDiagnostics}
					loading={isLoading}
				>
					{t("queuePage.refreshButton")}
				</Button>
			</Box>
		</Stack>
	);
};

export default Diagnostics;

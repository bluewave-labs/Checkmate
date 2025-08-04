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
			<StatusBoxes shouldRender={!isLoading} flexWrap="wrap">
				<StatBox
					gradient={true}
					status="up"
					heading={t("status")}
					subHeading={
						error 
							? "Error" 
							: isLoading 
								? "Loading..." 
								: diagnostics 
									? "Diagnostics Available" 
									: "No Data"
					}
				/>
				<StatBox
					heading="Event loop delay"
					subHeading={getHumanReadableDuration(diagnostics?.eventLoopDelayMs)}
				/>
				<StatBox
					heading="Uptime"
					subHeading={getHumanReadableDuration(diagnostics?.uptimeMs)}
				/>
				<StatBox
					heading="Used Heap Size"
					subHeading={formatBytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
				/>
				<StatBox
					heading="Total Heap Size"
					subHeading={formatBytes(diagnostics?.v8HeapStats?.totalHeapSizeBytes)}
				/>
				<StatBox
					heading="OS Memory Limit"
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
					Fetch Diagnostics
				</Button>
			</Box>
		</Stack>
	);
};

export default Diagnostics;

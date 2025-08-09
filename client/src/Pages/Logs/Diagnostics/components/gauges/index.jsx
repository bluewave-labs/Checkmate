import Stack from "@mui/material/Stack";
import CustomGauge from "../../../../../Components/Charts/CustomGauge";
import Typography from "@mui/material/Typography";

// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import { getPercentage, formatBytes } from "../../utils/utils";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

const BaseContainer = ({children}) => {
	const theme = useTheme()
	return(
		<Box 
			sx={{
				padding: theme.spacing(3),
				borderRadius: theme.spacing(2),
				border: `1px solid ${theme.palette.divider}`,
				minWidth: 250,
				width: "fit-content",
			}}>
				{children}
		</Box>
	);
};

const InfrastructureStyleGauge = ({ value, heading, metricOne, valueOne, metricTwo, valueTwo }) => {
	const theme = useTheme();

	const MetricRow = ({ label, value }) => (
		<Stack
			justifyContent="space-between"
			direction="row"
			alignItems="center"
			gap={theme.spacing(2)}
		>
			<Typography>{label}</Typography>
			<Typography sx={{
				borderRadius: theme.spacing(2),
				backgroundColor: theme.palette.tertiary.main,
				width: "40%",
				mb: theme.spacing(2),
				mt: theme.spacing(2),
				pr: theme.spacing(2),
				textAlign: "right",
			}}>
				{value}
			</Typography>
		</Stack>
	);

	return(
		<BaseContainer>
			<Stack direction="column" gap={theme.spacing(2)} alignItems="center">
				<Box
					sx = {{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: "100%",
					}}
				>
					<CustomGauge progress={value} radius={100}/>
					<Typography component="h2" sx={{fontWeight: 600}}>
						{heading}
					</Typography>		
				</Box>
				<Box sx={{ width:"100%", borderTop:`1px solid ${theme.palette.divider}`}}>
					<MetricRow label={metricOne} value={valueOne} />
					{metricTwo && valueTwo && (
						<MetricRow label={metricTwo} value={valueTwo} />
					)}
				</Box>
			</Stack>
		</BaseContainer>
	);
};

const Gauges = ({ diagnostics, isLoading }) => {
	const heapTotalSize = getPercentage(
		diagnostics?.v8HeapStats?.totalHeapSizeBytes,
		diagnostics?.v8HeapStats?.heapSizeLimitBytes
	);

	const heapUsedSize = getPercentage(
		diagnostics?.v8HeapStats?.usedHeapSizeBytes,
		diagnostics?.v8HeapStats?.heapSizeLimitBytes
	);

	const actualHeapUsed = getPercentage(
		diagnostics?.v8HeapStats?.usedHeapSizeBytes,
		diagnostics?.v8HeapStats?.totalHeapSizeBytes
	);

	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			direction="row"
			spacing={theme.spacing(8)}
			flexWrap="wrap"
		>
			<InfrastructureStyleGauge
				value={heapTotalSize}
				heading={t("diagnosticsPage.gauges.heapAllocationTitle")}
				metricOne={t("diagnosticsPage.gauges.heapAllocationSubtitle")}
				valueOne={`${heapTotalSize?.toFixed(1) || 0}%`}
				metricTwo={t("total")}
				valueTwo={formatBytes(diagnostics?.v8HeapStats?.heapSizeLimitBytes)}
			/>
			<InfrastructureStyleGauge
				value={heapUsedSize}
				heading={t("diagnosticsPage.gauges.heapUsageTitle")}
				metricOne={t("diagnosticsPage.gauges.heapUsageSubtitle")}
				valueOne={`${heapUsedSize?.toFixed(1) || 0}%`}
				metricTwo={t("used")}
				valueTwo={formatBytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
			/>
			<InfrastructureStyleGauge
				value={actualHeapUsed}
				heading={t("diagnosticsPage.gauges.heapUtilizationTitle")}
				metricOne={t("diagnosticsPage.gauges.heapUtilizationSubtitle")}
				valueOne={`${actualHeapUsed?.toFixed(1) || 0}%`}
				metricTwo={t("total")}
				valueTwo={formatBytes(diagnostics?.v8HeapStats?.totalHeapSizeBytes)}
			/>
			<InfrastructureStyleGauge
				value={diagnostics?.cpuUsage?.usagePercentage}
				heading={t("diagnosticsPage.gauges.instantCpuUsageTitle")}
				metricOne={t("diagnosticsPage.gauges.instantCpuUsageSubtitle")}
				valueOne={`${diagnostics?.cpuUsage?.usagePercentage?.toFixed(1) || 0}%`}
				metricTwo=""
				valueTwo=""
			/>
		</Stack>
	);
};

Gauges.propTypes = {
	diagnostics: PropTypes.object,
	isLoading: PropTypes.bool,
};

InfrastructureStyleGauge.propTypes = {
    value: PropTypes.number,
    heading: PropTypes.string,
    metricOne: PropTypes.string,
    valueOne: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    metricTwo: PropTypes.string,
    valueTwo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};
 
BaseContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Gauges;

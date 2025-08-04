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
				backgroundColor: theme.palette.background.paper,
				padding: theme.spacing(3),
				borderRadius: theme.spacing(2),
				border: `1px solid ${theme.palette.primary.lowContrast}`,
				minWidth: 250,
				width: "fit-content",
			}}>
				{children}
		</Box>
	);
};

const InfrastructureStyleGauge = ({ value, heading, metricOne, valueOne, metricTwo, valueTwo }) => {
	const theme = useTheme();
	const valueStyle = {
		borderRadius: theme.spacing(2),
		backgroundColor: theme.palette.tertiary.main,
		width: "40%",
		mb: theme.spacing(2),
		mt: theme.spacing(2),
		pr: theme.spacing(2),
		textAlign: "right",
	};

	return(
		<BaseContainer>
			<Stack direction="column" gap={theme.spacing(2)} alignItems="center">
				<Box
					sx = {{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: "100%",
						backgroundColor: theme.palette.gradient?.color1 || "transparent"
					}}
				>
					<CustomGauge progress={value} radius={100}/>
					<Typography component="h2" sx={{fontWeight: 600}}>
						{heading}
					</Typography>		
				</Box>
				<Box sx={{ width:"100%", borderTop:`1px solid ${theme.palette.primary.lowContrast}`}}>
					<Stack
						justifyContent={"space-between"}
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						<Typography>{metricOne}</Typography>
						<Typography sx={valueStyle}>{valueOne}</Typography>
					</Stack>
					<Stack
						justifyContent={"space-between"}
						direction="row"
						alignItems="center"
						gap={theme.spacing(2)}
					>
						<Typography>{metricTwo}</Typography>
						<Typography sx={valueStyle}>{valueTwo}</Typography>
					</Stack>
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
			  metricOne="% of available memory"
			  valueOne={`${heapTotalSize?.toFixed(1)}%`}
			  metricTwo="Total Heap Limit"
			  valueTwo={formatBytes(diagnostics?.v8HeapStats?.heapSizeLimitBytes)}
			  />
			<InfrastructureStyleGauge 
			  value={heapUsedSize}
			  heading={t("diagnosticsPage.gauges.heapUsageTitle")}
			  metricOne="% of available memory"
			  valueOne={`${heapTotalSize?.toFixed(1)}%`}
			  metricTwo="Used Heap Size"
			  valueTwo={formatBytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
			  />
			<InfrastructureStyleGauge 
			  value={actualHeapUsed}
			  heading={t("diagnosticsPage.gauges.heapUtilizationTitle")}
			  metricOne="% of available memory"
			  valueOne={`${heapTotalSize?.toFixed(1)}%`}
			  metricTwo="Total Heap Limit"
			  valueTwo={formatBytes(diagnostics?.v8HeapStats?.totalHeapSizeBytes)}
			  />
			<InfrastructureStyleGauge 
			  value={diagnostics?.cpuUsage?.usagePercentage}
			  heading={t("diagnosticsPage.gauges.instantCpuUsageTitle")}
			  metricOne="% of CPU used"
			  valueOne={`${diagnostics?.cpuUsage?.usagePercentage?.toFixed(2)}%`}
			  metricTwo="Usage level"
			  valueTwo={diagnostics?.cpuUsage?.usagePercentage > 80 ? "High" : diagnostics?.cpuUsage?.usagePercentage > 50 ? "Medium" : "Low"}
			  />
		</Stack>
	);
};

Gauges.propTypes = {
	diagnostics: PropTypes.object,
	isLoading: PropTypes.bool,
};

export default Gauges;

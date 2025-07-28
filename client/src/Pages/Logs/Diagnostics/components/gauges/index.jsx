import Stack from "@mui/material/Stack";
import Gauge from "../../../../../Components/Charts/CustomGauge";
import Typography from "@mui/material/Typography";

// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import { getPercentage } from "../../utils/utils";
import { useTranslation } from "react-i18next";

const GaugeBox = ({ title, subtitle, children }) => {
	const theme = useTheme();
	return (
		<Stack
			alignItems="center"
			p={theme.spacing(2)}
			maxWidth={150}
			width={150}
		>
			{children}

			<Typography variant="h2">{title}</Typography>
			<Typography variant="body2">{subtitle}</Typography>
		</Stack>
	);
};

GaugeBox.propTypes = {
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
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
			spacing={theme.spacing(4)}
			flexWrap="wrap"
		>
			<GaugeBox
				title={t("diagnosticsPage.gauges.heapAllocationTitle")}
				subtitle={t("diagnosticsPage.gauges.heapAllocationSubtitle")}
			>
				<Gauge
					isLoading={isLoading}
					radius={100}
					progress={heapTotalSize}
				/>
			</GaugeBox>
			<GaugeBox
				title={t("diagnosticsPage.gauges.heapUsageTitle")}
				subtitle={t("diagnosticsPage.gauges.heapUsageSubtitle")}
			>
				<Gauge
					isLoading={isLoading}
					radius={100}
					progress={heapUsedSize}
				/>
			</GaugeBox>
			<GaugeBox
				title={t("diagnosticsPage.gauges.heapUtilizationTitle")}
				subtitle={t("diagnosticsPage.gauges.heapUtilizationSubtitle")}
			>
				<Gauge
					isLoading={isLoading}
					radius={100}
					progress={actualHeapUsed}
				/>
			</GaugeBox>
			<GaugeBox
				title={t("diagnosticsPage.gauges.instantCpuUsageTitle")}
				subtitle={t("diagnosticsPage.gauges.instantCpuUsageSubtitle")}
			>
				<Gauge
					isLoading={isLoading}
					radius={100}
					progress={diagnostics?.cpuUsage?.usagePercentage}
					precision={2}
				/>
			</GaugeBox>
		</Stack>
	);
};

Gauges.propTypes = {
	diagnostics: PropTypes.object,
	isLoading: PropTypes.bool,
};

export default Gauges;

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { NoticeBanner } from "@/Components/design-elements";
import { HistogramInfrastructure } from "@/Components/monitors";

import { useTranslation } from "react-i18next";
import type { HardwareCheckStats } from "@/Types/Monitor";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { LAYOUT } from "@/Utils/Theme/constants";

const formatBytesToMB = (value: number) => `${(value / (1024 * 1024)).toFixed(2)} MB`;

interface ChartConfig {
	title: string;
	type: string;
	dataKeys: string[];
	strokeColor: string;
	gradientStartColor: string;
	idx: number | null;
	interfaceName?: string;
}

const getChartConfigs = (
	theme: any,
	checks: HardwareCheckStats[],
	t: any
): ChartConfig[] => {
	const configs: ChartConfig[] = [];

	// Find the first check that has network data to get interface names
	const checkWithNet = checks.find((c) => c.net && c.net.length > 0);
	const netInterfaces = checkWithNet?.net || [];

	netInterfaces.forEach((iface, idx) => {
		configs.push(
			{
				title: t("pages.infrastructure.charts.labels.netBytesSent", {
					name: iface.name,
				}),
				type: "netBytesSent",
				dataKeys: [`net[${idx}].bytesSentPerSecond`],
				strokeColor: theme.palette.primary.main,
				gradientStartColor: theme.palette.primary.main,
				idx,
				interfaceName: iface.name,
			},
			{
				title: t("pages.infrastructure.charts.labels.netBytesRecv", {
					name: iface.name,
				}),
				type: "netBytesRecv",
				dataKeys: [`net[${idx}].deltaBytesRecv`],
				strokeColor: theme.palette.success.main,
				gradientStartColor: theme.palette.success.main,
				idx,
				interfaceName: iface.name,
			}
		);
	});

	return configs;
};

// Loopback / bridge names Capture reports when it can only observe the
// container's own network namespace.
const CONTAINER_ONLY_IFACE_NAMES = new Set(["lo", "lo0", "docker0"]);

// Below this, an interface is carrying no traffic worth charting. Real host
// NICs sit orders of magnitude above it; a container's veth sits at or near
// zero.
const IDLE_INTERFACE_BYTES_PER_SECOND = 1024;

const interfaceIsIdle = (checks: HardwareCheckStats[], name: string): boolean =>
	checks.every((check) => {
		const iface = check.net?.find((candidate) => candidate.name === name);
		if (!iface) {
			return true;
		}
		return (
			(iface.bytesSentPerSecond || 0) < IDLE_INTERFACE_BYTES_PER_SECOND &&
			(iface.deltaBytesRecv || 0) < IDLE_INTERFACE_BYTES_PER_SECOND
		);
	});

const onlyContainerVisibleInterfaces = (checks: HardwareCheckStats[]): boolean => {
	const named = new Set<string>();
	checks.forEach((c) => c.net?.forEach((iface) => named.add(iface.name)));
	if (named.size === 0) {
		return false;
	}

	const names = [...named];
	if (names.every((name) => CONTAINER_ONLY_IFACE_NAMES.has(name))) {
		return true;
	}
	if (!names.some((name) => CONTAINER_ONLY_IFACE_NAMES.has(name))) {
		return false;
	}
	return names.every((name) => interfaceIsIdle(checks, name));
};

export const InfraNetworkCharts = ({
	checks,
	dateRange,
}: {
	checks: HardwareCheckStats[];
	dateRange: string;
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { t } = useTranslation();
	const chartConfigs = useMemo(
		() => getChartConfigs(theme, checks, t),
		[theme, checks, t]
	);
	const showLoopbackOnlyNotice =
		chartConfigs.length > 0 && onlyContainerVisibleInterfaces(checks);

	return (
		<Stack gap={theme.spacing(LAYOUT.XS)}>
			{showLoopbackOnlyNotice && (
				<NoticeBanner severity="warning">
					{t("pages.infrastructure.charts.labels.loopbackOnlyNotice")}
				</NoticeBanner>
			)}
			<Grid
				container
				spacing={theme.spacing(LAYOUT.MD)}
			>
				{chartConfigs.map((config) => {
					return (
						<Grid
							size={isSmall ? 12 : 6}
							key={`${config.type}-${config.interfaceName ?? config.idx ?? ""}`}
						>
							<HistogramInfrastructure
								dateRange={dateRange}
								title={config.title}
								type={config.type}
								idx={config.idx}
								checks={checks}
								xKey="bucketDate"
								dataKeys={config.dataKeys}
								gradient={true}
								gradientStartColor={config.gradientStartColor}
								gradientEndColor="#ffffff"
								strokeColor={config.strokeColor}
								yAxisFormatter={formatBytesToMB}
							/>
						</Grid>
					);
				})}
			</Grid>
		</Stack>
	);
};

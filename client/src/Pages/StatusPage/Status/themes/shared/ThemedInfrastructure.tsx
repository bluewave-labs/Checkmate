import Box from "@mui/material/Box";
import prettyBytes from "pretty-bytes";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";

export type GaugeFillLevel = "ok" | "warm" | "hot";

export interface InfraSx {
	containerSx: SxProps<Theme>;
	emptySx: SxProps<Theme>;
	gaugeSx: SxProps<Theme>;
	gaugeLabelSx: SxProps<Theme>;
	gaugeValueSx: SxProps<Theme>;
	gaugeBarSx: SxProps<Theme>;
	gaugeFillSx: (level: GaugeFillLevel, widthPct: number) => SxProps<Theme>;
	gaugeSubSx: SxProps<Theme>;
}

interface Props {
	monitor: Monitor & { checks?: Monitor["recentChecks"] };
	sxApi: InfraSx;
}

interface Gauge {
	key: string;
	label: string;
	value: number;
	sub: string;
}

const PCT = 100;

const heatLevel = (value: number): GaugeFillLevel =>
	value > 85 ? "hot" : value > 70 ? "warm" : "ok";

export const ThemedInfrastructure = ({ monitor, sxApi }: Props) => {
	const { t } = useTranslation();
	const latest = monitor.recentChecks?.[0] ?? monitor.checks?.[0];

	const renderEmpty = () => (
		<Box sx={sxApi.emptySx}>{t("pages.statusPages.monitorsList.noData")}</Box>
	);

	if (!latest) return renderEmpty();

	const gauges: Gauge[] = [];

	if (typeof latest.cpu?.usage_percent === "number") {
		const pct = latest.cpu.usage_percent * PCT;
		gauges.push({
			key: "cpu",
			label: t("pages.statusPages.monitorsList.infrastructure.cpu"),
			value: pct,
			sub: `${pct.toFixed(0)}%`,
		});
	}

	if (
		typeof latest.memory?.usage_percent === "number" &&
		typeof latest.memory?.used_bytes === "number" &&
		typeof latest.memory?.total_bytes === "number"
	) {
		gauges.push({
			key: "memory",
			label: t("pages.statusPages.monitorsList.infrastructure.memory"),
			value: latest.memory.usage_percent * PCT,
			sub: `${prettyBytes(latest.memory.used_bytes)} / ${prettyBytes(latest.memory.total_bytes)}`,
		});
	}

	if (latest.disk && latest.disk.length > 0) {
		const disks = latest.disk;
		const avg =
			(disks.reduce((acc, d) => acc + (d?.usage_percent ?? 0), 0) / disks.length) * PCT;
		const used = disks.reduce((acc, d) => acc + (d?.used_bytes ?? 0), 0);
		const total = disks.reduce((acc, d) => acc + (d?.total_bytes ?? 0), 0);
		gauges.push({
			key: "disk",
			label: t("pages.statusPages.monitorsList.infrastructure.disk"),
			value: avg,
			sub: `${prettyBytes(used)} / ${prettyBytes(total)}`,
		});
	}

	if (gauges.length === 0) return renderEmpty();

	return (
		<Box sx={sxApi.containerSx}>
			{gauges.map((g) => (
				<Box
					key={g.key}
					sx={sxApi.gaugeSx}
				>
					<Box sx={sxApi.gaugeLabelSx}>{g.label}</Box>
					<Box sx={sxApi.gaugeValueSx}>{g.value.toFixed(0)}%</Box>
					<Box sx={sxApi.gaugeBarSx}>
						<Box sx={sxApi.gaugeFillSx(heatLevel(g.value), Math.min(100, g.value))} />
					</Box>
					<Box sx={sxApi.gaugeSubSx}>{g.sub}</Box>
				</Box>
			))}
		</Box>
	);
};

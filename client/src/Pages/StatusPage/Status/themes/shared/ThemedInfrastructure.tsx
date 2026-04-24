import Box from "@mui/material/Box";
import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";

interface Props {
	monitor: Monitor & { checks?: Monitor["recentChecks"] };
	classPrefix: string;
}

interface Gauge {
	key: string;
	label: string;
	value: number;
	sub: string;
}

const PCT = 100;

export const ThemedInfrastructure = ({ monitor, classPrefix }: Props) => {
	const { t } = useTranslation();
	const latest = monitor.recentChecks?.[0] ?? monitor.checks?.[0];
	if (!latest) {
		return (
			<Box className={`${classPrefix}-infra-empty`}>
				{t("pages.statusPages.monitorsList.noData")}
			</Box>
		);
	}

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

	if (gauges.length === 0) {
		return (
			<Box className={`${classPrefix}-infra-empty`}>
				{t("pages.statusPages.monitorsList.noData")}
			</Box>
		);
	}

	return (
		<Box className={`${classPrefix}-infra`}>
			{gauges.map((g) => {
				const heatClass =
					g.value > 85 ? `${classPrefix}-hot` : g.value > 70 ? `${classPrefix}-warm` : "";
				return (
					<Box
						key={g.key}
						className={`${classPrefix}-gauge`}
					>
						<Box className={`${classPrefix}-gauge-label`}>{g.label}</Box>
						<Box className={`${classPrefix}-gauge-value`}>{g.value.toFixed(0)}%</Box>
						<Box className={`${classPrefix}-gauge-bar`}>
							<Box
								className={`${classPrefix}-gauge-fill ${heatClass}`}
								style={{ width: `${Math.min(100, g.value)}%` }}
							/>
						</Box>
						<Box className={`${classPrefix}-gauge-sub`}>{g.sub}</Box>
					</Box>
				);
			})}
		</Box>
	);
};

import Stack from "@mui/material/Stack";
import { DetailGauge } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import { getFrequency } from "@/Utils/InfraUtils";
import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { CheckSnapshot } from "@/Types/Check";

export const InfraDetailsGauges = ({
	snapshot,
}: {
	snapshot: CheckSnapshot | undefined;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	if (!snapshot) {
		return null;
	}

	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			spacing={theme.spacing(8)}
			alignItems={"stretch"}
		>
			<DetailGauge
				title={t("pages.infrastructure.gauges.memory.title")}
				maxWidth={260}
				progress={(snapshot?.memory?.usage_percent || 0) * 100}
				upperLabel={t("pages.infrastructure.gauges.memory.upperLabel")}
				upperValue={prettyBytes(snapshot?.memory?.used_bytes || 0)}
				lowerLabel={t("pages.infrastructure.gauges.memory.lowerLabel")}
				lowerValue={prettyBytes(snapshot?.memory?.total_bytes || 0)}
			/>
			<DetailGauge
				title={t("pages.infrastructure.gauges.cpu.title")}
				maxWidth={260}
				progress={(snapshot?.cpu?.usage_percent || 0) * 100}
				upperLabel={t("pages.infrastructure.gauges.cpu.upperLabel")}
				upperValue={getFrequency(snapshot?.cpu?.current_frequency || 0)}
				lowerLabel={t("pages.infrastructure.gauges.cpu.lowerLabel")}
				lowerValue={getFrequency(snapshot?.cpu?.frequency || 0)}
			/>
			{snapshot?.disk?.map((disk, idx) => {
				return (
					<DetailGauge
						key={disk?.device || 0 + idx}
						// title={`Disk ${idx} usage`}
						title={t("pages.infrastructure.gauges.disk.title", { idx })}
						maxWidth={260}
						progress={(disk.usage_percent || 0) * 100}
						upperLabel={t("pages.infrastructure.gauges.disk.upperLabel")}
						upperValue={prettyBytes(disk?.used_bytes || 0)}
						lowerLabel={t("pages.infrastructure.gauges.disk.lowerLabel")}
						lowerValue={prettyBytes(disk?.total_bytes || 0)}
					/>
				);
			})}
		</Stack>
	);
};

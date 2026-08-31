import Stack from "@mui/material/Stack";
import { DetailGauge } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import { getFrequency } from "@/Utils/InfraUtils";
import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { CheckSnapshot } from "@/Types/Check";

const GAUGE_MAX_WIDTH = 260;

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
			flexWrap={"wrap"}
			useFlexGap
		>
			<DetailGauge
				title={t("pages.infrastructure.gauges.memory.title")}
				maxWidth={GAUGE_MAX_WIDTH}
				progress={(snapshot?.memory?.usage_percent || 0) * 100}
				upperLabel={t("pages.infrastructure.gauges.memory.upperLabel")}
				upperValue={prettyBytes(snapshot?.memory?.used_bytes || 0)}
				lowerLabel={t("pages.infrastructure.gauges.memory.lowerLabel")}
				lowerValue={prettyBytes(snapshot?.memory?.total_bytes || 0)}
				flexBasis={isSmall ? "auto" : GAUGE_MAX_WIDTH}
			/>
			<DetailGauge
				title={t("pages.infrastructure.gauges.cpu.title")}
				maxWidth={GAUGE_MAX_WIDTH}
				progress={(snapshot?.cpu?.usage_percent || 0) * 100}
				upperLabel={t("pages.infrastructure.gauges.cpu.upperLabel")}
				upperValue={getFrequency(snapshot?.cpu?.current_frequency || 0)}
				lowerLabel={t("pages.infrastructure.gauges.cpu.lowerLabel")}
				lowerValue={getFrequency(snapshot?.cpu?.frequency || 0)}
				flexBasis={isSmall ? "auto" : GAUGE_MAX_WIDTH}
			/>
			{snapshot?.disk?.map((disk, idx) => {
				return (
					<DetailGauge
						key={disk?.device || `disk-${idx}`}
						// title={`Disk ${idx} usage`}
						title={t("pages.infrastructure.gauges.disk.title", { idx })}
						maxWidth={GAUGE_MAX_WIDTH}
						progress={(disk.usage_percent || 0) * 100}
						upperLabel={t("pages.infrastructure.gauges.disk.upperLabel")}
						upperValue={prettyBytes(disk?.used_bytes || 0)}
						lowerLabel={t("pages.infrastructure.gauges.disk.lowerLabel")}
						lowerValue={prettyBytes(disk?.total_bytes || 0)}
						flexBasis={isSmall ? "auto" : GAUGE_MAX_WIDTH}
					/>
				);
			})}
		</Stack>
	);
};

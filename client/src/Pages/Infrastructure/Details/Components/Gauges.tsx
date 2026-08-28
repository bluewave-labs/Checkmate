import Stack from "@mui/material/Stack";
import { DetailGauge } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import { getFrequency } from "@/Utils/InfraUtils";
import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { CheckSnapshot } from "@/Types/Check";

// Width each gauge card aims for, and the basis the wrapping row breaks on.
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
			sx={{
				// The gauge cards are flex: 1 1 0, so a wrapping row would never
				// overflow and they would squash to min-content instead of breaking
				// the line. Give each one its own width as the basis so the row wraps
				// at the intended card size.
				"& > *": { flexBasis: GAUGE_MAX_WIDTH },
			}}
		>
			<DetailGauge
				title={t("pages.infrastructure.gauges.memory.title")}
				maxWidth={GAUGE_MAX_WIDTH}
				progress={(snapshot?.memory?.usage_percent || 0) * 100}
				upperLabel={t("pages.infrastructure.gauges.memory.upperLabel")}
				upperValue={prettyBytes(snapshot?.memory?.used_bytes || 0)}
				lowerLabel={t("pages.infrastructure.gauges.memory.lowerLabel")}
				lowerValue={prettyBytes(snapshot?.memory?.total_bytes || 0)}
			/>
			<DetailGauge
				title={t("pages.infrastructure.gauges.cpu.title")}
				maxWidth={GAUGE_MAX_WIDTH}
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
						maxWidth={GAUGE_MAX_WIDTH}
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

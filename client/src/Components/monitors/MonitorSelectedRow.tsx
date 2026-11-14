import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { getMonitorTypeLabel, type Monitor } from "@/Types/Monitor";
import { getStatusPalette } from "@/Utils/MonitorUtils";
import { toSignalKey, typographyLevels } from "@/Utils/Theme/Palette";
import { BADGE, LAYOUT } from "@/Utils/Theme/constants";

// One line for a monitor picked in a multi-select: status dot, name, then the
// type and address in a quieter tone. The name keeps at least half the width;
// the details truncate with an ellipsis, so the row never wraps.
export const MonitorSelectedRow = ({ monitor }: { monitor: Monitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const status = monitor.isActive ? monitor.status : "paused";
	const dotColor = theme.palette.signal[toSignalKey(getStatusPalette(status))].mark;
	const address = monitor.url
		? `${monitor.url}${monitor.port ? `:${monitor.port}` : ""}`
		: "";
	const details = [getMonitorTypeLabel(monitor.type, t), address]
		.filter(Boolean)
		.join(" · ");

	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(LAYOUT.XS)}
			flexGrow={1}
			minWidth={0}
			overflow="hidden"
			title={`${monitor.name} · ${details}`}
		>
			<Box
				width={BADGE.DOT}
				height={BADGE.DOT}
				flexShrink={0}
				borderRadius="50%"
				bgcolor={dotColor}
			/>
			<Typography
				noWrap
				flexShrink={0}
				maxWidth="50%"
			>
				{monitor.name}
			</Typography>
			<Typography
				noWrap
				minWidth={0}
				fontSize={typographyLevels.sm}
				color={theme.palette.neutral.subdued}
			>
				{details}
			</Typography>
		</Stack>
	);
};

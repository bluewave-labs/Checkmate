import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { getMonitorTypeLabel, type Monitor } from "@/Types/Monitor";
import { getStatusSignal } from "@/Utils/MonitorUtils";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { LAYOUT, STATUS_DOT_SIZE } from "@/Utils/Theme/constants";

export const MonitorSelectedRow = ({ monitor }: { monitor: Monitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const status = monitor.isActive ? monitor.status : "paused";
	const dotColor = theme.palette.signal[getStatusSignal(status)].mark;
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
			gap={LAYOUT.XS}
			flexGrow={1}
			minWidth={0}
			overflow="hidden"
			title={`${monitor.name} · ${details}`}
		>
			<Box
				width={STATUS_DOT_SIZE}
				height={STATUS_DOT_SIZE}
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

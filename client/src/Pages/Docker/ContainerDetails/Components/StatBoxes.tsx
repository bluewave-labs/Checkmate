import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

// Types

// Hooks
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { DockerContainerInfo } from "@/Types/Check";

// Utils
import { formatDuration } from "@/Utils/TimeUtils";
import { PLACEHOLDER } from "@/Utils/FormatUtils";
import { getDockerPalette } from "@/Utils/MonitorUtils";

export const DockerContainerStatusBoxes = ({
	container,
}: {
	container: DockerContainerInfo | undefined;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!container) return null;

	const { state, restartCount, health } = container;
	const runningFor = container.startedAt
		? Date.now() - new Date(container.startedAt).getTime()
		: undefined;
	const palette = getDockerPalette(state);
	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
			flexWrap={"wrap"}
		>
			<StatBox
				title={t("common.labels.state")}
				subtitle={state}
				palette={palette}
			/>
			<StatBox
				title={t("common.labels.uptime")}
				subtitle={runningFor === undefined ? PLACEHOLDER : formatDuration(runningFor)}
			/>
			<StatBox
				title={t("common.labels.restarts")}
				subtitle={restartCount === undefined ? PLACEHOLDER : String(restartCount)}
			/>
			<StatBox
				title={t("common.labels.health")}
				subtitle={health}
			/>
		</Stack>
	);
};

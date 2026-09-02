import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

// Types

// Hooks
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { DockerContainerInfo } from "@/Types/Check";

// Utils
import { formatDuration } from "@/Utils/TimeUtils";

export const DockerContainerStatusBoxes = ({
	container,
}: {
	container: DockerContainerInfo | undefined;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!container) return null;

	const { state, restartCount, health } = container;
	const startedAt = container.startedAt ?? "0";
	const runningFor = Date.now() - new Date(startedAt).getTime();
	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
			flexWrap={"wrap"}
		>
			<StatBox
				title={t("common.labels.state")}
				subtitle={state}
			/>
			<StatBox
				title={t("common.labels.uptime")}
				subtitle={formatDuration(runningFor)}
			/>
			<StatBox
				title={t("common.labels.restarts")}
				subtitle={String(restartCount ?? 0)}
			/>
			<StatBox
				title={t("common.labels.health")}
				subtitle={health}
			/>
		</Stack>
	);
};

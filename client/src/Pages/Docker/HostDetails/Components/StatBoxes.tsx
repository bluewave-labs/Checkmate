import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

// Types
import type { DockerStats } from "@/Types/Monitor";

// Hooks
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

// Utils

export const DockerStatusBoxes = ({ stats }: { stats: DockerStats | undefined }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!stats) return null;

	const { total, running, stopped, unhealthy } = stats.latest?.summary ?? {};

	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
			flexWrap={"wrap"}
		>
			<StatBox
				title={t("pages.docker.host.statBoxes.containers")}
				subtitle={String(total)}
			/>
			<StatBox
				title={t("pages.docker.host.statBoxes.running")}
				subtitle={String(running)}
			/>

			<StatBox
				title={t("pages.docker.host.statBoxes.stopped")}
				subtitle={String(stopped)}
			/>

			<StatBox
				title={t("pages.docker.host.statBoxes.unhealthy")}
				subtitle={String(unhealthy)}
			/>
		</Stack>
	);
};

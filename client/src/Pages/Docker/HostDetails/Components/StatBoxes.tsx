import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

// Types
import type { DockerStats } from "@/Types/Monitor";

// Hooks
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

// Utils
import prettyBytes from "pretty-bytes";

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
				title={"Containers"}
				subtitle={String(total)}
			/>
			<StatBox
				title={"Running"}
				subtitle={String(running)}
			/>

			<StatBox
				title={"Stopped"}
				subtitle={String(stopped)}
			/>

			<StatBox
				title={"Unhealthy"}
				subtitle={String(unhealthy)}
			/>
		</Stack>
	);
};

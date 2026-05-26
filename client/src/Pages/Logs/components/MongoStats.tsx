import Box from "@mui/material/Box";
import { StatBox } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material";
import type { Diagnostics } from "@/Types/Diagnostics";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MongoStatsProps {
	diagnostics: Diagnostics | null;
}

export const MongoStats = ({ diagnostics }: MongoStatsProps) => {
	const theme = useTheme();

	const mongoStats = diagnostics?.mongoStats;
	if (!mongoStats) {
		return null;
	}

	return (
		<Box
			display={"grid"}
			gap={theme.spacing(LAYOUT.MD)}
			sx={{
				gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" },
				"& > *": { width: "100% !important" },
			}}
		>
			<StatBox
				title={"Ready state"}
				subtitle={mongoStats.readyState.toString()}
			/>
			<StatBox
				title={"Host"}
				subtitle={mongoStats.host}
			/>
			<StatBox
				title={"Port"}
				subtitle={mongoStats.port.toString()}
			/>
			<StatBox
				title={"DB Name"}
				subtitle={mongoStats.dbName}
			/>
			<StatBox
				title={"Storage size"}
				subtitle={prettyBytes(mongoStats.totalSize)}
			/>
		</Box>
	);
};

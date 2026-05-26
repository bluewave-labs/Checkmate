import Box from "@mui/material/Box";
import { StatBox } from "@/Components/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import prettyBytes from "pretty-bytes";
import prettyMilliseconds from "pretty-ms";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Diagnostics } from "@/Types/Diagnostics";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MongoStatsProps {
	diagnostics: Diagnostics | null;
}

const PLACEHOLDER = "—";

export const MongoStats = ({ diagnostics }: MongoStatsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const mongoStats = diagnostics?.mongoStats;
	if (!mongoStats) {
		return null;
	}

	console.log("Mongo Stats:", mongoStats); // Debug log to check the structure of mongoStats

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
				subtitle={prettyBytes(mongoStats.stats.totalSize)}
			/>
			{mongoStats.collectionStats.map((colStat) => {
				console.log(colStat);
				return (
					<StatBox
						key={colStat.name}
						title={colStat.name}
						subtitle={""}
					>
						<Stack>
							{colStat.documentCount !== undefined && (
								<Typography variant="body2">{`Documents: ${colStat.documentCount}`}</Typography>
							)}
							{colStat.timeseries?.bucketCount !== undefined && (
								<Typography variant="body2">{`Bucket count: ${colStat.timeseries.bucketCount}`}</Typography>
							)}
							<Typography variant="body2">{`Storage size: ${prettyBytes(colStat.storageSize)}`}</Typography>
							<Typography variant="body2">{`Index size: ${prettyBytes(colStat.totalIndexSize)}`}</Typography>
							<Typography variant="body2">{`Total size: ${prettyBytes(colStat.totalSize)}`}</Typography>
						</Stack>
					</StatBox>
				);
			})}
		</Box>
	);
};

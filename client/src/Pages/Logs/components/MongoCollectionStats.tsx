import Box from "@mui/material/Box";
import { StatBox, Gauge, Tooltip } from "@/Components/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material";
import type { Diagnostics } from "@/Types/Diagnostics";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MongoStatsProps {
	diagnostics: Diagnostics | null;
}

export const MongoCollectionStats = ({ diagnostics }: MongoStatsProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

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
			{mongoStats.collections.map((colStat) => (
				<StatBox
					key={colStat.name}
					title={colStat.name}
					subtitle={""}
				>
					<Stack
						direction={"row"}
						alignItems={"center"}
						justifyContent={"space-between"}
					>
						<Stack>
							{/* <Typography variant="body2">{`Documents: ${colStat.documentCount}`}</Typography> */}
							<Typography variant="body2">
								{t("pages.logs.diagnostics.mongoDBCollectionStats.documents", {
									count: colStat.documentCount,
								})}
							</Typography>
							{colStat.bucketCount !== undefined && (
								<Typography variant="body2">
									{t("pages.logs.diagnostics.mongoDBCollectionStats.bucketCount", {
										count: colStat.bucketCount,
									})}
								</Typography>
							)}
							<Typography variant="body2">
								{t("pages.logs.diagnostics.mongoDBCollectionStats.storageSize", {
									size: prettyBytes(colStat.storageSize),
								})}
							</Typography>
							<Typography variant="body2">
								{t("pages.logs.diagnostics.mongoDBCollectionStats.indexSize", {
									size: prettyBytes(colStat.totalIndexSize),
								})}
							</Typography>
							<Typography variant="body2">
								{t("pages.logs.diagnostics.mongoDBCollectionStats.totalSize", {
									size: prettyBytes(colStat.totalSize),
								})}
							</Typography>
						</Stack>
						<Stack alignItems={"center"}>
							<Tooltip
								title={t("pages.logs.diagnostics.mongoDBCollectionStats.dbUsageTooltip", {
									percentage: ((colStat.totalSize / mongoStats.totalSize) * 100).toFixed(
										2
									),
								})}
								placement="top"
								slotProps={{
									popper: {
										modifiers: [
											{
												name: "offset",
												options: {
													offset: [0, -10],
												},
											},
										],
									},
								}}
							>
								<Gauge progress={(colStat.totalSize / mongoStats.totalSize) * 100} />
							</Tooltip>
						</Stack>
					</Stack>
				</StatBox>
			))}
		</Box>
	);
};

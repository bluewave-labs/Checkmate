import Box from "@mui/material/Box";
import { StatBox } from "@/Components/design-elements";

import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material";
import type { Diagnostics } from "@/Types/Diagnostics";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MongoStatsProps {
	diagnostics: Diagnostics | null;
}

export const MongoStats = ({ diagnostics }: MongoStatsProps) => {
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
			<StatBox
				title={t("pages.logs.diagnostics.mongoDBStats.readyState")}
				subtitle={mongoStats.readyState.toString()}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.mongoDBStats.host")}
				subtitle={mongoStats.host}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.mongoDBStats.port")}
				subtitle={mongoStats.port.toString()}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.mongoDBStats.dbName")}
				subtitle={mongoStats.dbName}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.mongoDBStats.storageSize")}
				subtitle={prettyBytes(mongoStats.totalSize)}
			/>
		</Box>
	);
};

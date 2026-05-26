import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Stats } from "@/Pages/Logs/components/Stats";
import { MongoStats } from "@/Pages/Logs/components/MongoStats";
import { MongoCollectionStats } from "./components/MongoCollectionStats";
import { StatGauges } from "@/Pages/Logs/components/StatGauges";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import type { Diagnostics } from "@/Types/Diagnostics";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

export const TabDiagnostics = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const {
		data: diagnostics,
		isLoading: _isLoading,
		error: _error,
		refetch: _refetch,
	} = useGet<Diagnostics>("/diagnostic/system", {}, { refreshInterval: 5000 });

	return (
		<Stack gap={theme.spacing(LAYOUT.XL)}>
			<Stack gap={theme.spacing(LAYOUT.XS)}>
				<Stack gap={theme.spacing(SPACING.SM)}>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
					>
						{t("pages.logs.diagnostics.sections.runtimeStats.title")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.diagnostics.sections.runtimeStats.description")}
					</Typography>
				</Stack>
				<Stats diagnostics={diagnostics} />
			</Stack>
			<Stack gap={theme.spacing(LAYOUT.XS)}>
				<Stack gap={theme.spacing(SPACING.SM)}>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
					>
						{t("pages.logs.diagnostics.sections.memoryCpu.title")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.diagnostics.sections.memoryCpu.description")}
					</Typography>
				</Stack>
				<StatGauges diagnostics={diagnostics} />
			</Stack>
			<Stack gap={theme.spacing(LAYOUT.XS)}>
				<Typography
					variant="eyebrow"
					color={theme.palette.text.secondary}
				>
					{t("pages.logs.diagnostics.sections.mongoDBStats.title")}
				</Typography>
				<Typography color={theme.palette.text.secondary}>
					{t("pages.logs.diagnostics.sections.mongoDBStats.description")}
				</Typography>
				<MongoStats diagnostics={diagnostics} />
			</Stack>
			<Stack gap={theme.spacing(LAYOUT.XS)}>
				<Typography
					variant="eyebrow"
					color={theme.palette.text.secondary}
				>
					{t("pages.logs.diagnostics.sections.mongoDBCollectionStats.title")}
				</Typography>
				<Typography color={theme.palette.text.secondary}>
					{t("pages.logs.diagnostics.sections.mongoDBCollectionStats.description")}
				</Typography>
				<MongoCollectionStats diagnostics={diagnostics} />
			</Stack>
		</Stack>
	);
};

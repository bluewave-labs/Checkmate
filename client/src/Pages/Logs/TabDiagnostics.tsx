import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Stats } from "@/Pages/Logs/components/Stats";
import { StatGauges } from "@/Pages/Logs/components/StatGauges";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import type { Diagnostics } from "@/Types/Diagnostics";

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
		<Stack gap={theme.spacing(12)}>
			<Stack gap={theme.spacing(4)}>
				<Stack gap={theme.spacing(1)}>
					<Typography
						variant="eyebrow"
						color="text.secondary"
					>
						{t("pages.logs.diagnostics.sections.runtimeStats.title")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.diagnostics.sections.runtimeStats.description")}
					</Typography>
				</Stack>
				<Stats diagnostics={diagnostics} />
			</Stack>
			<Stack gap={theme.spacing(4)}>
				<Stack gap={theme.spacing(1)}>
					<Typography
						variant="eyebrow"
						color="text.secondary"
					>
						{t("pages.logs.diagnostics.sections.memoryCpu.title")}
					</Typography>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.diagnostics.sections.memoryCpu.description")}
					</Typography>
				</Stack>
				<StatGauges diagnostics={diagnostics} />
			</Stack>
		</Stack>
	);
};

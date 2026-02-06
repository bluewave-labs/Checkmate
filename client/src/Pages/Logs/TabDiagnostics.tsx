import Stack from "@mui/material/Stack";
import { Stats } from "@/Pages/Logs/Stats";
import { StatGauges } from "@/Pages/Logs/StatGauges";

import { useTheme } from "@mui/material";
import { useGet } from "@/Hooks/UseApi";
import type { Diagnostics } from "@/Types/Diagnostics";

export const TabDiagnostics = () => {
	const theme = useTheme();
	const {
		data: diagnostics,
		isLoading: _isLoading,
		error: _error,
		refetch: _refetch,
	} = useGet<Diagnostics>("/diagnostic/system", {}, { refreshInterval: 5000 });

	return (
		<Stack gap={theme.spacing(8)}>
			<Stats diagnostics={diagnostics} />
			<StatGauges diagnostics={diagnostics} />
		</Stack>
	);
};

import Stack from "@mui/material/Stack";
import { Stats } from "@/Pages/Logs/Stats";

import { useTheme } from "@mui/material";
import { useGet } from "@/Hooks/UseApi";
import type { Diagnostics } from "@/Types/Diagnostics";

export const TabDiagnostics = () => {
	const theme = useTheme();
	const {
		data: diagnostics,
		isLoading,
		error,
		refetch,
	} = useGet<Diagnostics>("/diagnostic/system");

	return (
		<Stack gap={theme.spacing(8)}>
			<Stats diagnostics={diagnostics} />
		</Stack>
	);
};

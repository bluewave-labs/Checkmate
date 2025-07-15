import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Gauges from "./components/gauges";
import Stats from "./components/stats";
import Divider from "@mui/material/Divider";

import { useTheme } from "@emotion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetchDiagnostics } from "../../../Hooks/logHooks";

const Diagnostics = () => {
	// Local state

	// Hooks
	const theme = useTheme();
	const { t } = useTranslation();
	const [diagnostics, isLoading, error] = useFetchDiagnostics();
	// Setup
	return (
		<Stack gap={theme.spacing(4)}>
			<Box>
				<Typography variant="h2">{t("diagnosticsPage.diagnosticDescription")}</Typography>
			</Box>
			<Divider color={theme.palette.accent.main} />
			<Stack
				gap={theme.spacing(20)}
				mt={theme.spacing(10)}
			>
				<Gauges
					diagnostics={diagnostics}
					isLoading={isLoading}
				/>
				<Stats
					diagnostics={diagnostics}
					isLoading={isLoading}
				/>
			</Stack>
		</Stack>
	);
};

export default Diagnostics;

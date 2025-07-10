import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Gauges from "./components/gauges";

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
	console.log(diagnostics);
	// Setup
	return (
		<Stack gap={theme.spacing(4)}>
			<Box>
				<Typography variant="h2">{t("diagnosticsPage.description")}</Typography>
			</Box>
			<Gauges diagnostics={diagnostics} />
		</Stack>
	);
};

export default Diagnostics;

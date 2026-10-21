import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { LogWithId } from "@/Pages/Logs/components/TableLogs";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { CodeBlock } from "@/Components/design-elements";

interface LogDetailsProps {
	log: LogWithId;
}

export const LogDetails = ({ log }: LogDetailsProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack gap={theme.spacing(LAYOUT.XS)}>
			{log.details && (
				<Stack gap={theme.spacing(SPACING.SM)}>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.details.fields")}
					</Typography>
					<CodeBlock>{JSON.stringify(log.details, null, 2)}</CodeBlock>
				</Stack>
			)}
			{log.stack && (
				<Stack gap={theme.spacing(SPACING.SM)}>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.logs.details.stack")}
					</Typography>
					<CodeBlock>{log.stack}</CodeBlock>
				</Stack>
			)}
		</Stack>
	);
};

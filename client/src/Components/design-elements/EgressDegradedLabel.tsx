import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { typographyLevels } from "@/Utils/Theme/Palette";
import type { Check } from "@/Types/Check";

// Marks a check taken while the instance's own egress was down. Such a check is kept in listings but
// counts towards no total, so the tables say so next to its status.
export const EgressDegradedLabel = ({
	check,
}: {
	check: Pick<Check, "egressStatus">;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	if (check.egressStatus !== "degraded") return null;
	return (
		<Typography
			component="span"
			color={theme.palette.warning.main}
			fontSize={typographyLevels.xs}
		>
			{t("pages.checks.table.egressDegraded")}
		</Typography>
	);
};

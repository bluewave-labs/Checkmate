import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LAYOUT } from "@/Utils/Theme/constants";
import CopyButton from "./CopyButton";

/**
 * Text alongside a copy button, for table cells holding values worth lifting
 * out - error messages in particular.
 */
const CopyableText = ({
	value,
	fallback = "N/A",
	copyLabel,
}: {
	value?: string | null;
	fallback?: string;
	copyLabel?: string;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!value) return <>{fallback}</>;

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			gap={theme.spacing(LAYOUT.XS)}
		>
			<span>{value}</span>
			<CopyButton
				value={value}
				label={copyLabel ?? t("common.copyMessage")}
			/>
		</Stack>
	);
};

export default CopyableText;

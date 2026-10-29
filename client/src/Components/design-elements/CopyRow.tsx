import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import Icon from "./Icon";
import { useToast } from "@/Hooks/UseToast";
import { LAYOUT } from "@/Utils/Theme/constants";

interface CopyRowProps {
	label: string;
	value: string;
}

export const CopyRow = ({ label, value }: CopyRowProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastSuccess, toastError } = useToast();

	// navigator.clipboard is undefined on plain-HTTP origins; the catch covers it
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			toastSuccess(t("common.copy.copied"));
		} catch {
			toastError(t("common.copy.copyFailed"));
		}
	};

	return (
		<Stack gap={theme.spacing(LAYOUT.XS)}>
			<Typography color={theme.palette.text.secondary}>{label}</Typography>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(LAYOUT.XS)}
			>
				<Box
					flex={1}
					minWidth={0}
				>
					<CodeBlock wrap>{value}</CodeBlock>
				</Box>
				<IconButton
					size="small"
					onClick={handleCopy}
					aria-label={t("common.copy.copy")}
				>
					<Icon icon={Copy} />
				</IconButton>
			</Stack>
		</Stack>
	);
};

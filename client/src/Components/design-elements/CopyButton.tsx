import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/Hooks/UseToast";

const RESET_DELAY_MS = 1500;

/**
 * Copies `value` to the clipboard. Shows a tick for a moment so the click is
 * acknowledged without moving the user anywhere.
 */
const CopyButton = ({ value, label }: { value: string; label?: string }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastError } = useToast();
	const [copied, setCopied] = useState(false);

	const handleCopy = async (e: React.MouseEvent) => {
		// The button usually sits inside a clickable row.
		e.stopPropagation();

		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), RESET_DELAY_MS);
		} catch {
			toastError(t("common.copyFailed"));
		}
	};

	const title = copied ? t("common.copied") : (label ?? t("common.copy"));

	return (
		<Tooltip
			title={title}
			disableInteractive
		>
			<IconButton
				onClick={handleCopy}
				aria-label={title}
				size="small"
			>
				{copied ? (
					<Check
						size={14}
						strokeWidth={1.5}
						color={theme.palette.success.main}
					/>
				) : (
					<Copy
						size={14}
						strokeWidth={1.5}
						color={theme.palette.text.secondary}
					/>
				)}
			</IconButton>
		</Tooltip>
	);
};

export default CopyButton;

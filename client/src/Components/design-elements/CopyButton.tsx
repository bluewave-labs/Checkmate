import { useEffect, useRef, useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/Hooks/UseToast";

const RESET_DELAY_MS = 1500;

/**
 * `navigator.clipboard` only exists on secure origins, and Checkmate is often
 * self-hosted over plain HTTP on a LAN address. Fall back to a hidden textarea
 * there rather than leaving the button permanently broken.
 */
const copyText = async (value: string) => {
	if (navigator.clipboard?.writeText) {
		return navigator.clipboard.writeText(value);
	}

	const textarea = document.createElement("textarea");
	textarea.value = value;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	document.body.appendChild(textarea);
	textarea.select();

	try {
		if (!document.execCommand("copy")) throw new Error("Copy command was rejected");
	} finally {
		document.body.removeChild(textarea);
	}
};

/**
 * Copies `value` to the clipboard. Shows a tick for a moment so the click is
 * acknowledged without moving the user anywhere.
 */
const CopyButton = ({ value, label }: { value: string; label?: string }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastError } = useToast();
	const [copied, setCopied] = useState(false);
	const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	// These rows unmount on pagination, so the tick timer has to be cancelled.
	useEffect(() => () => clearTimeout(resetTimer.current), []);

	const handleCopy = async (e: React.MouseEvent) => {
		// The button usually sits inside a clickable row.
		e.stopPropagation();

		try {
			await copyText(value);
			setCopied(true);
			clearTimeout(resetTimer.current);
			resetTimer.current = setTimeout(() => setCopied(false), RESET_DELAY_MS);
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

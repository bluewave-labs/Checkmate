import { useEffect, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { CopyRow } from "@/Components/design-elements";
import { Checkbox, Dialog, TextField } from "@/Components/inputs";
import { useToast } from "@/Hooks/UseToast";
import { LAYOUT } from "@/Utils/Theme/constants";

export const RecoveryKeyDialog = ({
	recoveryKey,
	onStored,
}: {
	recoveryKey: string | null;
	onStored: () => void;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastSuccess, toastError } = useToast();
	const [verifying, setVerifying] = useState(false);
	const [keyCheck, setKeyCheck] = useState("");
	const [acknowledged, setAcknowledged] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (recoveryKey === null) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [recoveryKey]);

	const copyKey = async () => {
		if (!recoveryKey) return;
		try {
			await navigator.clipboard.writeText(recoveryKey);
			toastSuccess(t("common.copy.copied"));
		} catch {
			toastError(t("common.copy.copyFailed"));
		}
	};

	const overwriteClipboard = async () => {
		try {
			await navigator.clipboard.writeText(" ");
		} catch {
			const replace = (event: ClipboardEvent) => {
				event.clipboardData?.setData("text/plain", " ");
				event.preventDefault();
			};
			document.addEventListener("copy", replace);
			document.execCommand("copy");
			document.removeEventListener("copy", replace);
		}
	};

	const continueToVerify = () => {
		void overwriteClipboard();
		setVerifying(true);
	};

	const showAgain = () => {
		setVerifying(false);
		setKeyCheck("");
		setError(null);
	};

	const confirmStored = () => {
		if (keyCheck.trim().toLowerCase() !== recoveryKey?.toLowerCase()) {
			setError(t("pages.settings.form.connect.backup.keyMismatch"));
			return;
		}
		if (!acknowledged) {
			setError(t("pages.settings.form.connect.backup.keyAckRequired"));
			return;
		}
		setVerifying(false);
		setKeyCheck("");
		setAcknowledged(false);
		setError(null);
		onStored();
	};

	return (
		<Dialog
			open={recoveryKey !== null}
			title={t("pages.settings.form.connect.backup.keyTitle")}
			maxWidth="sm"
			fullWidth
			cancelText={t(
				verifying
					? "pages.settings.form.connect.backup.keyShowAgain"
					: "pages.settings.form.connect.backup.keyCopy"
			)}
			onCancel={(event) => {
				if (!event) return;
				if (verifying) {
					showAgain();
					return;
				}
				void copyKey();
			}}
			confirmText={t(
				verifying
					? "pages.settings.form.connect.backup.keyDone"
					: "pages.settings.form.connect.backup.keyContinue"
			)}
			onConfirm={verifying ? confirmStored : continueToVerify}
		>
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<Typography color={theme.palette.error.main}>
					{t("pages.settings.form.connect.backup.keyWarning")}
				</Typography>
				{!verifying && (
					<CopyRow
						label={t("pages.settings.form.connect.backup.keyLabel")}
						value={recoveryKey ?? ""}
					/>
				)}
				{verifying && (
					<>
						<Typography color={theme.palette.text.secondary}>
							{t("pages.settings.form.connect.backup.keyVerifyHelp")}
						</Typography>
						<TextField
							fullWidth
							autoComplete="off"
							value={keyCheck}
							placeholder={t("pages.settings.form.connect.backup.keyPlaceholder")}
							onChange={(event) => {
								setKeyCheck(event.target.value);
								setError(null);
							}}
						/>
						<FormControlLabel
							control={
								<Checkbox
									checked={acknowledged}
									onChange={(event) => {
										setAcknowledged(event.target.checked);
										setError(null);
									}}
								/>
							}
							label={t("pages.settings.form.connect.backup.keyAcknowledge")}
						/>
						{error && <Typography color={theme.palette.error.main}>{error}</Typography>}
					</>
				)}
			</Stack>
		</Dialog>
	);
};

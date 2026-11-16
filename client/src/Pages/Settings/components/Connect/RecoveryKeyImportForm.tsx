import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import { useToast } from "@/Hooks/UseToast";
import { LAYOUT } from "@/Utils/Theme/constants";
import type {
	ConnectImportKeyBody,
	ConnectQueued,
	ConnectVerifyResult,
} from "@/Types/Connect";
import { TipButton } from "./TipButton";

const RECOVERY_KEY_PATTERN = /^[a-fA-F0-9]{64}$/;

export const RecoveryKeyImportForm = ({
	replaceExisting,
	busy,
	lastVerify,
	onQueued,
	onKeyChanged,
	onClose,
}: {
	replaceExisting: boolean;
	busy: boolean;
	lastVerify: ConnectVerifyResult | null;
	onQueued: () => Promise<unknown>;
	onKeyChanged: () => Promise<unknown>;
	onClose: () => void;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastSuccess } = useToast();
	const [keyInput, setKeyInput] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [previousCheckAt, setPreviousCheckAt] = useState<string | null>(null);
	const { post, loading } = usePost<ConnectImportKeyBody, ConnectQueued>();

	const outcome =
		submitted && lastVerify && lastVerify.at !== previousCheckAt ? lastVerify : null;
	const waiting = submitted && !outcome;
	const problem = outcome && outcome.outcome !== "ok" ? outcome : null;
	const keyInputValid = RECOVERY_KEY_PATTERN.test(keyInput.trim());

	useEffect(() => {
		if (outcome?.outcome !== "ok") return;
		setSubmitted(false);
		toastSuccess(t("pages.settings.form.connect.backup.verifyOutcome.ok"));
		void onKeyChanged().then(onClose);
	}, [outcome, t, toastSuccess, onKeyChanged, onClose]);

	const submit = async () => {
		const previous = lastVerify?.at ?? null;
		const result = await post("/connect/backup/recovery-key/import", {
			recoveryKey: keyInput.trim(),
			replaceExisting,
		});
		if (!result?.success) return;
		setPreviousCheckAt(previous);
		setSubmitted(true);
		await onQueued();
	};

	return (
		<Stack
			gap={theme.spacing(LAYOUT.SM)}
			width="100%"
		>
			<Typography color={theme.palette.text.secondary}>
				{t(
					replaceExisting
						? "pages.settings.form.connect.backup.replaceKeyHelp"
						: "pages.settings.form.connect.backup.importKeyHelp"
				)}
			</Typography>
			{replaceExisting && (
				<Typography color={theme.palette.error.main}>
					{t("pages.settings.form.connect.backup.replaceKeyWarning")}
				</Typography>
			)}
			<TextField
				fullWidth
				type="password"
				autoComplete="off"
				disabled={waiting}
				value={keyInput}
				onChange={(event) => {
					setKeyInput(event.target.value);
					setSubmitted(false);
				}}
				placeholder={t("pages.settings.form.connect.backup.keyPlaceholder")}
			/>
			{problem && (
				<Typography color={theme.palette.error.main}>
					{t(`pages.settings.form.connect.backup.verifyOutcome.${problem.outcome}`, {
						error: problem.error ?? "",
					})}
				</Typography>
			)}
			<Stack
				direction="row"
				gap={theme.spacing(LAYOUT.SM)}
			>
				<TipButton
					tip={t("pages.settings.form.connect.tooltips.useKey")}
					variant="contained"
					disabled={!keyInputValid || busy || waiting}
					loading={loading}
					onClick={() => void submit()}
				>
					{t("pages.settings.form.connect.backup.importKeyConfirm")}
				</TipButton>
				<Button
					variant="outlined"
					disabled={loading}
					onClick={onClose}
				>
					{t("common.buttons.cancel")}
				</Button>
			</Stack>
		</Stack>
	);
};

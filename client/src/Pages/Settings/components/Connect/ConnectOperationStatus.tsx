import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import { ValueLabel } from "@/Components/design-elements";
import type { ConnectBackupStatus, ConnectOperation } from "@/Types/Connect";

const FINISHED_LABEL_MS = 10000;

export const ConnectOperationStatus = ({
	operation,
	backupStatus,
	hideIdle = false,
}: {
	operation: ConnectOperation;
	backupStatus: ConnectBackupStatus | null;
	hideIdle?: boolean;
}) => {
	const { t } = useTranslation();
	const [watching, setWatching] = useState(false);
	const [finished, setFinished] = useState(false);
	const active = backupStatus?.operation?.type === operation;

	useEffect(() => {
		if (active) {
			setWatching(true);
			return;
		}
		if (!watching) return;
		setFinished(true);
		setWatching(false);
	}, [active, watching]);

	useEffect(() => {
		if (!finished) return;
		const timer = setTimeout(() => setFinished(false), FINISHED_LABEL_MS);
		return () => clearTimeout(timer);
	}, [finished]);

	const progressText = (): string => {
		const progress = backupStatus?.progress ?? null;
		if (!progress || (progress.operation === "verify" && progress.attempt === null)) {
			if (operation === "verify") {
				return t("pages.settings.form.connect.backup.progress.checking");
			}
			return t(`pages.settings.form.connect.backup.progress.queued.${operation}`);
		}
		const step = t(
			`pages.settings.form.connect.backup.progress.${progress.operation}.${progress.stage}`,
			{ attempt: progress.attempt, attempts: progress.attempts }
		);
		if (progress.bytes) {
			return t("pages.settings.form.connect.backup.progressWithSize", {
				step,
				size: prettyBytes(progress.bytes),
			});
		}
		if (progress.percent !== null) {
			return t("pages.settings.form.connect.backup.progressWithPercent", {
				step,
				percent: progress.percent,
			});
		}
		return step;
	};

	const succeeded = (): boolean => {
		if (operation === "backup") return backupStatus?.lastBackup?.ok ?? false;
		if (operation === "restore") return backupStatus?.lastRestore?.ok ?? false;
		return backupStatus?.lastVerify?.outcome === "ok";
	};

	const label = () => {
		if (active) {
			return (
				<ValueLabel
					value="neutral"
					text={progressText()}
					preserveCase
				/>
			);
		}
		if (finished) {
			const ok = succeeded();
			return (
				<ValueLabel
					value={ok ? "positive" : "negative"}
					text={t(
						`pages.settings.form.connect.backup.progress.finished.${operation}.${ok ? "ok" : "failed"}`
					)}
				/>
			);
		}
		return (
			<ValueLabel
				value="positive"
				text={t("pages.settings.form.connect.backup.progress.idle")}
			/>
		);
	};

	if (hideIdle && !active && !finished) return null;

	return <Box role="status">{label()}</Box>;
};

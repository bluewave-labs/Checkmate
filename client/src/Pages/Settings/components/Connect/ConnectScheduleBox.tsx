import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { Select, SwitchComponent } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatDuration, MS_PER_HOUR } from "@/Utils/TimeUtils";
import {
	ConnectBackupKinds,
	ConnectScheduleIntervals,
	type ConnectBackupKind,
	type ConnectSchedule,
	type ConnectScheduleInterval,
	type ConnectStatus,
} from "@/Types/Connect";

export const ConnectScheduleBox = ({
	schedule,
	onChanged,
}: {
	schedule: ConnectSchedule;
	onChanged: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	const { post, loading } = usePost<ConnectSchedule, ConnectStatus>();

	const save = async (next: ConnectSchedule) => {
		const result = await post("/connect/backup/schedule", next);
		if (!result?.success) return;
		await onChanged();
	};

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.schedule.title")}
			subtitle={t("pages.settings.form.connect.schedule.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.SM)}
					alignItems="flex-start"
				>
					<SwitchComponent
						checked={schedule.enabled}
						disabled={loading}
						onChange={(_, enabled) => void save({ ...schedule, enabled })}
					/>
					{schedule.enabled && (
						<Select<ConnectScheduleInterval>
							fieldLabel={t("pages.settings.form.connect.schedule.interval")}
							value={schedule.intervalHours}
							disabled={loading}
							onChange={(event) => {
								const intervalHours = ConnectScheduleIntervals.find(
									(hours) => hours === Number(event.target.value)
								);
								if (intervalHours === undefined) return;
								void save({ ...schedule, intervalHours });
							}}
						>
							{ConnectScheduleIntervals.map((hours) => (
								<MenuItem
									key={hours}
									value={hours}
								>
									{formatDuration(hours * MS_PER_HOUR, {
										long: true,
										locale: i18n.resolvedLanguage,
									})}
								</MenuItem>
							))}
						</Select>
					)}
					{schedule.enabled && (
						<Select<ConnectBackupKind>
							fieldLabel={t("pages.settings.form.connect.schedule.kind")}
							value={schedule.kind}
							disabled={loading}
							onChange={(event) => {
								const kind = ConnectBackupKinds.find(
									(option) => option === event.target.value
								);
								if (kind === undefined) return;
								void save({ ...schedule, kind });
							}}
						>
							{ConnectBackupKinds.map((kind) => (
								<MenuItem
									key={kind}
									value={kind}
								>
									{t(`pages.settings.form.connect.backup.kind.${kind}`)}
								</MenuItem>
							))}
						</Select>
					)}
				</Stack>
			}
		/>
	);
};

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { Trash2 } from "lucide-react";
import { Autocomplete, TextField } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";

type EscalationStep = {
	notificationIds?: string[];
	delayMinutes?: number;
};

type NotificationItem = {
	id: string;
	notificationName?: string;
};

type Props = {
	notifications: NotificationItem[];
	value: EscalationStep;
	onChange: (step: EscalationStep) => void;
};

export default function MonitorEscalation({ notifications, value, onChange }: Props) {
	const theme = useTheme();
	const { t } = useTranslation();
	const options = useMemo(
		() =>
			notifications.map((notification) => ({
				id: notification.id,
				name: notification.notificationName ?? notification.id,
			})),
		[notifications]
	);
	const selectedOptions = options.filter((option) =>
		(value.notificationIds ?? []).includes(option.id)
	);

	return (
		<Stack spacing={theme.spacing(LAYOUT.MD)}>
			<TextField
				type="number"
				fieldLabel={t("pages.createMonitor.form.notifications.escalation.delayLabel")}
				value={value.delayMinutes ?? 1}
				onChange={(event) => {
					const parsedValue = Number(event.target.value);
					onChange({
						...value,
						delayMinutes: Number.isFinite(parsedValue)
							? Math.max(1, Math.floor(parsedValue))
							: 1,
					});
				}}
				inputProps={{ min: 1 }}
				fullWidth
			/>
			<FormControl>
				<Typography
					component="label"
					variant="body2"
					sx={{ mb: theme.spacing(0.5), color: "text.secondary" }}
				>
					{t("pages.createMonitor.form.notifications.escalation.channelsLabel")}
				</Typography>
			<Autocomplete
				multiple
				options={options}
				value={selectedOptions}
				getOptionLabel={(option) => option.name}
				onChange={(_: unknown, selected: typeof options) =>
					onChange({
						...value,
						notificationIds: selected.map((item) => item.id),
					})
				}
				isOptionEqualToValue={(option, selected) => option.id === selected.id}
			/>
			</FormControl>
			{selectedOptions.length > 0 && (
				<Stack
					flex={1}
					width="100%"
				>
					{selectedOptions.map((notification, index) => (
						<Stack
							direction="row"
							alignItems="center"
							key={notification.id}
							width="100%"
						>
							<Typography flexGrow={1}>{notification.name}</Typography>
							<IconButton
								size="small"
								onClick={() => {
									onChange({
										...value,
										notificationIds: (value.notificationIds ?? []).filter(
											(id) => id !== notification.id
										),
									});
								}}
								aria-label={t(
									"pages.createMonitor.form.notifications.escalation.removeLabel"
								)}
							>
								<Trash2 size={16} />
							</IconButton>
							{index < selectedOptions.length - 1 && <Divider />}
						</Stack>
					))}
				</Stack>
			)}
		</Stack>
	);
}
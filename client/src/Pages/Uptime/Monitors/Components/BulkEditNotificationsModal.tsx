import { Dialog, Select, Autocomplete } from "@/Components/inputs";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGet, usePatch } from "@/Hooks/UseApi";
import type { Notification } from "@/Types/Notification";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import { Trash2 } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";

type ActionType = "add" | "remove" | "set";

export const BulkEditNotificationsModal = ({
	open,
	monitorIds,
	onClose,
	onSuccess,
}: {
	open: boolean;
	monitorIds: string[];
	onClose: () => void;
	onSuccess: () => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [action, setAction] = useState<ActionType>("add");
	const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);

	const { data: notifications } = useGet<Notification[]>("/notifications/team");
	const { patch, loading } = usePatch();

	const handleConfirm = async () => {
		if (selectedNotificationIds.length === 0 && action !== "set") return;

		const result = await patch("/notifications", {
			monitorIds,
			notificationIds: selectedNotificationIds,
			action,
		});

		if (result?.success) {
			onSuccess();
			onClose();
		}
	};

	const notificationOptions = useMemo(() => {
		return (notifications ?? []).map((n) => ({
			...n,
			name: n.notificationName,
		}));
	}, [notifications]);

	const selectedItems = useMemo(() => {
		return notificationOptions.filter((n) => selectedNotificationIds.includes(n.id));
	}, [notificationOptions, selectedNotificationIds]);

	return (
		<Dialog
			open={open}
			title={t("pages.uptime.bulkEdit.title", { defaultValue: "Bulk Edit Notifications" })}
			content={t("pages.uptime.bulkEdit.description", {
				defaultValue: `Apply notification changes to ${monitorIds.length} selected monitors.`,
			})}
			onConfirm={handleConfirm}
			onCancel={onClose}
			loading={loading}
			confirmText={t("common.buttons.save")}
		>
			<Stack spacing={theme.spacing(LAYOUT.MD)} sx={{ mt: 2 }}>
				<Select
					value={action}
					onChange={(e) => setAction(e.target.value as ActionType)}
					fieldLabel={t("pages.uptime.bulkEdit.actionLabel", { defaultValue: "Action" })}
				>
					<MenuItem value="add">
						{t("pages.uptime.bulkEdit.actionAdd", { defaultValue: "Add Notifications" })}
					</MenuItem>
					<MenuItem value="remove">
						{t("pages.uptime.bulkEdit.actionRemove", { defaultValue: "Remove Notifications" })}
					</MenuItem>
					<MenuItem value="set">
						{t("pages.uptime.bulkEdit.actionSet", { defaultValue: "Set Notifications (Replace All)" })}
					</MenuItem>
				</Select>

				<Autocomplete
					multiple
					options={notificationOptions}
					value={selectedItems}
					getOptionLabel={(option) => option.name}
					onChange={(_: unknown, newValue: typeof notificationOptions) => {
						setSelectedNotificationIds(newValue.map((n) => n.id));
					}}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					fieldLabel={t("pages.uptime.bulkEdit.notificationsLabel", {
						defaultValue: "Notifications",
					})}
				/>

				{selectedItems.length > 0 && (
					<Stack flex={1} width="100%">
						{selectedItems.map((notification, index) => (
							<Stack
								direction="row"
								alignItems="center"
								key={notification.id}
								width="100%"
							>
								<Typography flexGrow={1}>{notification.notificationName}</Typography>
								<IconButton
									size="small"
									onClick={() => {
										setSelectedNotificationIds((prev) =>
											prev.filter((id) => id !== notification.id)
										);
									}}
									aria-label="Remove notification"
								>
									<Trash2 size={16} />
								</IconButton>
								{index < selectedItems.length - 1 && <Divider />}
							</Stack>
						))}
					</Stack>
				)}
			</Stack>
		</Dialog>
	);
};

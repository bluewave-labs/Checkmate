import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { Dialog, Select, RadioWithDescription } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useGet, usePatch } from "@/Hooks/UseApi";
import type { Notification } from "@/Types/Notification";

interface BulkEditNotificationsModalProps {
	open: boolean;
	onClose: () => void;
	selectedMonitors: string[];
	onSuccess: () => void;
}

export const BulkEditNotificationsModal: React.FC<BulkEditNotificationsModalProps> = ({
	open,
	onClose,
	selectedMonitors,
	onSuccess,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [action, setAction] = useState<"add" | "remove" | "set">("add");
	const [notificationIds, setNotificationIds] = useState<string[]>([]);

	// Fetch available notifications
	const { data: notifications } = useGet<Notification[]>(
		"/notifications/team",
		undefined,
		{
			keepPreviousData: true,
		}
	);

	const { patch, loading: isPatching } = usePatch();

	// Reset state when modal opens
	useEffect(() => {
		if (open) {
			setAction("add");
			setNotificationIds([]);
		}
	}, [open]);

	const handleConfirm = async () => {
		const res = await patch("/monitors/notifications", {
			monitorIds: selectedMonitors,
			notificationIds,
			action,
		});

		if (res) {
			onSuccess();
		}
	};

	// Prevent submitting empty arrays unless the action is 'set' (as per PR feedback!)
	const isMissingSelection = action !== "set" && notificationIds.length === 0;

	return (
		<Dialog
			open={open}
			title={t("pages.common.monitors.bulkEdit.title", {
				defaultValue: "Edit Notifications",
			})}
			onCancel={onClose}
			onConfirm={isMissingSelection ? undefined : handleConfirm}
			loading={isPatching}
			maxWidth="sm"
			fullWidth
		>
			<Stack
				spacing={theme.spacing(4)}
				mt={theme.spacing(2)}
			>
				<Typography variant="body1">
					{t("pages.common.monitors.bulkEdit.selectedText", {
						count: selectedMonitors.length,
						defaultValue: `You are applying changes to {{count}} monitor(s).`,
					})}
				</Typography>

				<RadioGroup
					value={action}
					onChange={(e) => setAction(e.target.value as "add" | "remove" | "set")}
				>
					<RadioWithDescription
						value="add"
						label={t("pages.common.monitors.bulkEdit.actionAdd", { defaultValue: "Add" })}
						description={t("pages.common.monitors.bulkEdit.actionAddDesc", {
							defaultValue:
								"Adds the selected notifications to these monitors without removing existing ones.",
						})}
					/>
					<RadioWithDescription
						value="remove"
						label={t("pages.common.monitors.bulkEdit.actionRemove", {
							defaultValue: "Remove",
						})}
						description={t("pages.common.monitors.bulkEdit.actionRemoveDesc", {
							defaultValue:
								"Removes exclusively the selected notifications from these monitors.",
						})}
					/>
					<RadioWithDescription
						value="set"
						label={t("pages.common.monitors.bulkEdit.actionSet", {
							defaultValue: "Replace all",
						})}
						description={t("pages.common.monitors.bulkEdit.actionSetDesc", {
							defaultValue:
								"Replaces all existing notifications. Leave empty to clear all notifications.",
						})}
					/>
				</RadioGroup>

				<Select
					multiple
					value={notificationIds}
					onChange={(e) => setNotificationIds(e.target.value as string[])}
					fieldLabel={t("pages.common.monitors.bulkEdit.selectLabel", {
						defaultValue: "Notification Channels",
					})}
					placeholder={t("pages.common.monitors.bulkEdit.selectPlaceholder", {
						defaultValue: "Select channels...",
					})}
				>
					{notifications?.map((n) => (
						<MenuItem
							key={n.id}
							value={n.id}
						>
							{n.notificationName} ({n.type.toUpperCase()})
						</MenuItem>
					))}
				</Select>
			</Stack>
		</Dialog>
	);
};

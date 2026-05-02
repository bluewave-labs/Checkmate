import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { Dialog, Select, RadioWithDescription } from "@/Components/inputs";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useGet, usePatch } from "@/Hooks/UseApi";
import type { Notification } from "@/Types/Notification";

interface BulkEditNotificationsModalProps {
	open: boolean;
	onClose: () => void;
	selectedMonitors: string[];
	onComplete: (success: boolean) => void;
}

export const BulkEditNotificationsModal: React.FC<BulkEditNotificationsModalProps> = ({
	open,
	onClose,
	selectedMonitors,
	onComplete,
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

	const { patch, loading: isPatching, error } = usePatch();

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

		onComplete(!!res);
	};

	// Prevent submitting empty arrays unless the action is 'set'
	const isMissingSelection = action !== "set" && notificationIds.length === 0;

	return (
		<Dialog
			open={open}
			title={t("pages.common.monitors.bulkEdit.title")}
			onCancel={onClose}
			onConfirm={isMissingSelection ? undefined : handleConfirm}
			loading={isPatching}
			maxWidth="sm"
			fullWidth
		>
			<Stack
				spacing={theme.spacing(LAYOUT.XS)}
				mt={theme.spacing(SPACING.LG)}
			>
				{error && <Alert severity="error">{error}</Alert>}
				<Typography variant="body1">
					{t("pages.common.monitors.bulkEdit.selectedText", {
						count: selectedMonitors.length,
					})}
				</Typography>

				<RadioGroup
					value={action}
					onChange={(e) => {
						const val = e.target.value;
						if (val === "add" || val === "remove" || val === "set") {
							setAction(val);
						}
					}}
				>
					<RadioWithDescription
						value="add"
						label={t("pages.common.monitors.bulkEdit.actionAdd")}
						description={t("pages.common.monitors.bulkEdit.actionAddDesc")}
					/>
					<RadioWithDescription
						value="remove"
						label={t("pages.common.monitors.bulkEdit.actionRemove")}
						description={t("pages.common.monitors.bulkEdit.actionRemoveDesc")}
					/>
					<RadioWithDescription
						value="set"
						label={t("pages.common.monitors.bulkEdit.actionSet")}
						description={t("pages.common.monitors.bulkEdit.actionSetDesc")}
					/>
				</RadioGroup>

				<Select
					multiple
					value={notificationIds}
					onChange={(e) => {
						const val = e.target.value;
						if (typeof val === "string") {
							setNotificationIds(val.split(","));
						} else if (Array.isArray(val)) {
							setNotificationIds(val.filter((v) => typeof v === "string"));
						}
					}}
					fieldLabel={t("pages.common.monitors.bulkEdit.selectLabel")}
					placeholder={t("pages.common.monitors.bulkEdit.selectPlaceholder")}
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

import MenuItem from "@mui/material/MenuItem";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Select } from "@/Components/inputs";
import { usePatch } from "@/Hooks/UseApi";
import type { Invite } from "@/Types/Invite";

const DURATION_OPTIONS: { hours: number; labelKey: string }[] = [
	{ hours: 1, labelKey: "oneHour" },
	{ hours: 24, labelKey: "oneDay" },
	{ hours: 24 * 3, labelKey: "threeDays" },
	{ hours: 24 * 7, labelKey: "oneWeek" },
	{ hours: 24 * 30, labelKey: "thirtyDays" },
];

interface ChangeInviteDurationDialogProps {
	invite: Invite | null;
	onClose: () => void;
	onSuccess?: () => void;
}

export const ChangeInviteDurationDialog = ({
	invite,
	onClose,
	onSuccess,
}: ChangeInviteDurationDialogProps) => {
	const { t } = useTranslation();
	const [expiresInHours, setExpiresInHours] = useState<number>(DURATION_OPTIONS[0].hours);
	const { patch, loading } = usePatch<{ expiresInHours: number }, Invite>();

	useEffect(() => {
		if (invite) {
			setExpiresInHours(DURATION_OPTIONS[0].hours);
		}
	}, [invite]);

	const handleConfirm = async () => {
		if (!invite) return;
		const result = await patch(`/invite/${invite.id}/expiry`, { expiresInHours });
		if (result?.success) {
			onSuccess?.();
			onClose();
		}
	};

	return (
		<Dialog
			open={invite !== null}
			title={t("pages.account.team.invites.changeDuration.title")}
			content={
				invite
					? t("pages.account.team.invites.changeDuration.description", {
							email: invite.email,
						})
					: undefined
			}
			onCancel={onClose}
			onConfirm={handleConfirm}
			confirmText={t("common.buttons.confirm")}
			loading={loading}
			maxWidth="xs"
			fullWidth
		>
			<Select
				value={expiresInHours}
				onChange={(e) => setExpiresInHours(Number(e.target.value))}
				fieldLabel={t("pages.account.team.invites.changeDuration.durationLabel")}
				fullWidth
			>
				{DURATION_OPTIONS.map((option) => (
					<MenuItem
						key={option.hours}
						value={option.hours}
					>
						{t(`pages.account.team.invites.changeDuration.durations.${option.labelKey}`)}
					</MenuItem>
				))}
			</Select>
		</Dialog>
	);
};

import MenuItem from "@mui/material/MenuItem";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Select } from "@/Components/inputs";
import { usePatch } from "@/Hooks/UseApi";
import type { Invite } from "@/Types/Invite";
import { INVITE_DURATION_OPTIONS } from "@/Utils/inviteDurationOptions";

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
	const [expiresInHours, setExpiresInHours] = useState<number>(
		INVITE_DURATION_OPTIONS[0].hours
	);
	const { patch, loading } = usePatch<{ expiresInHours: number }, Invite>();

	useEffect(() => {
		if (invite) {
			setExpiresInHours(INVITE_DURATION_OPTIONS[0].hours);
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
				fieldLabel={t("pages.account.team.invites.durationLabel")}
				fullWidth
			>
				{INVITE_DURATION_OPTIONS.map((option) => (
					<MenuItem
						key={option.hours}
						value={option.hours}
					>
						{t(`pages.account.team.invites.durations.${option.labelKey}`)}
					</MenuItem>
				))}
			</Select>
		</Dialog>
	);
};

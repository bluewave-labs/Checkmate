import { Stack } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Dialog, TextField, Select, Button } from "@/Components/v2/inputs";
import type { UserRole } from "@/Types/User";

interface InviteTeamMemberDialogProps {
	open: boolean;
	onClose: () => void;
}

export const InviteTeamMemberDialog = ({
	open,
	onClose,
}: InviteTeamMemberDialogProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const roleOptions: { value: UserRole; label: string }[] = [
		{ value: "admin", label: t("common.auth.roles.admin") },
		{ value: "user", label: t("common.auth.roles.user") },
	];

	return (
		<Dialog
			open={open}
			title={t("pages.account.team.invite.title")}
			content={t("pages.account.team.invite.description")}
			onCancel={onClose}
			onConfirm={() => {}}
			maxWidth="sm"
			fullWidth
			confirmText={t("pages.account.team.invite.sendInvite")}
			additionalButtons={
				<Button
					variant="contained"
					color="primary"
					onClick={() => {}}
				>
					{t("pages.account.team.invite.generateToken")}
				</Button>
			}
		>
			<Stack
				gap={theme.spacing(4)}
				mt={theme.spacing(4)}
			>
				<TextField
					fieldLabel={t("pages.account.team.invite.email.label")}
					placeholder={t("pages.account.team.invite.email.placeholder")}
					type="email"
					fullWidth
				/>
				<Select
					fieldLabel={t("pages.account.team.invite.role.label")}
					placeholder={t("pages.account.team.invite.role.placeholder")}
					defaultValue="user"
					fullWidth
				>
					{roleOptions.map((option) => (
						<MenuItem
							key={option.value}
							value={option.value}
						>
							{option.label}
						</MenuItem>
					))}
				</Select>
			</Stack>
		</Dialog>
	);
};

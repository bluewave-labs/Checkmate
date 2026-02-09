import { Stack } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Dialog, TextField, Select } from "@/Components/v2/inputs";
import type { UserRole } from "@/Types/User";

interface AddTeamMemberDialogProps {
	open: boolean;
	onClose: () => void;
}

export const AddTeamMemberDialog = ({ open, onClose }: AddTeamMemberDialogProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const roleOptions: { value: UserRole; label: string }[] = [
		{ value: "admin", label: t("common.auth.roles.admin") },
		{ value: "user", label: t("common.auth.roles.user") },
	];

	const handleClose = () => {
		onClose();
	};

	return (
		<Dialog
			open={open}
			title={t("pages.account.team.addMember.title")}
			content={t("pages.account.team.addMember.description")}
			onCancel={handleClose}
			onConfirm={() => {}}
			confirmText={t("common.buttons.addMember")}
			maxWidth="sm"
			fullWidth
		>
			<Stack
				gap={theme.spacing(4)}
				mt={theme.spacing(4)}
			>
				<TextField
					fieldLabel={t("pages.auth.register.form.option.name.label")}
					placeholder={t("pages.auth.register.form.option.name.placeholder")}
					fullWidth
				/>
				<TextField
					fieldLabel={t("pages.auth.register.form.option.surname.label")}
					placeholder={t("pages.auth.register.form.option.surname.placeholder")}
					fullWidth
				/>
				<TextField
					fieldLabel={t("pages.auth.common.form.option.email.label")}
					placeholder={t("pages.auth.common.form.option.email.placeholder")}
					type="email"
					fullWidth
				/>
				<Select
					fieldLabel={t("pages.account.team.invite.role.label")}
					placeholder={t("pages.account.team.invite.role.placeholder")}
					fullWidth
					defaultValue="user"
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
				<TextField
					fieldLabel={t("pages.auth.common.form.option.password.label")}
					placeholder={t("pages.auth.common.form.option.password.placeholder")}
					type="password"
					fullWidth
				/>
				<TextField
					fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
					placeholder={t("pages.auth.common.form.option.password.placeholder")}
					type="password"
					fullWidth
				/>
			</Stack>
		</Dialog>
	);
};

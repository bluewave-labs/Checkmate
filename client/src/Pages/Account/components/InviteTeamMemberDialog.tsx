import { Stack } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useTheme, FormHelperText, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { Dialog, TextField, Select, Button } from "@/Components/inputs";
import type { UserRole } from "@/Types/User";
import { useInviteForm } from "@/Hooks/useInviteForm";
import type { InviteFormData } from "@/Validation/invite";
import { usePost } from "@/Hooks/UseApi";

const CLIENT_HOST = import.meta.env.VITE_APP_CLIENT_HOST;

interface InviteResponse {
	token: string;
}

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
	const { resolver, defaults } = useInviteForm();

	const { control, handleSubmit, reset } = useForm<InviteFormData>({
		resolver,
		defaultValues: defaults,
		values: defaults,
	});

	const { post: generateToken, loading: generateLoading } = usePost<
		InviteFormData,
		InviteResponse
	>();
	const { post: sendInvite, loading: sendLoading } = usePost<
		InviteFormData,
		InviteResponse
	>();
	const [inviteLink, setInviteLink] = useState<string | null>(null);

	const roleOptions: { value: UserRole; label: string }[] = [
		{ value: "admin", label: t("common.auth.roles.admin") },
		{ value: "user", label: t("common.auth.roles.user") },
	];

	const handleGenerateToken = async (data: InviteFormData) => {
		const result = await generateToken("/invite", data);
		if (result?.data?.token) {
			const token = result.data.token;
			const link = CLIENT_HOST ? `${CLIENT_HOST}/register/${token}` : token;
			setInviteLink(link);
		}
	};

	const handleSendInvite = async (data: InviteFormData) => {
		const result = await sendInvite("/invite/send", data);
		if (result?.success) {
			handleClose();
		}
	};

	const handleClose = () => {
		reset();
		setInviteLink(null);
		onClose();
	};

	return (
		<Dialog
			open={open}
			title={t("pages.account.team.invite.title")}
			content={t("pages.account.team.invite.description")}
			onCancel={handleClose}
			onConfirm={handleSubmit(handleSendInvite)}
			confirmText={t("common.buttons.sendInvite")}
			loading={sendLoading || generateLoading}
			maxWidth="sm"
			fullWidth
			additionalButtons={
				<Button
					variant="contained"
					color="primary"
					onClick={handleSubmit(handleGenerateToken)}
					loading={generateLoading || sendLoading}
				>
					{t("common.buttons.generateToken")}
				</Button>
			}
		>
			<Stack
				gap={theme.spacing(4)}
				mt={theme.spacing(4)}
			>
				<Controller
					name="email"
					control={control}
					render={({ field, fieldState }) => (
						<TextField
							{...field}
							fieldLabel={t("common.form.email.option.email.label")}
							placeholder={t("common.form.email.option.email.placeholder")}
							type="email"
							fullWidth
							error={!!fieldState.error}
							helperText={fieldState.error?.message ?? ""}
						/>
					)}
				/>
				<Controller
					name="role"
					control={control}
					render={({ field: { value, onChange, ...field }, fieldState }) => (
						<>
							<Select
								{...field}
								value={Array.isArray(value) ? (value[0] ?? "") : ""}
								onChange={(e) => onChange([e.target.value as UserRole])}
								fieldLabel={t("common.form.role.option.role.label")}
								fullWidth
								error={!!fieldState.error}
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
							{fieldState.error && (
								<FormHelperText error>{fieldState.error.message}</FormHelperText>
							)}
						</>
					)}
				/>
				{inviteLink && (
					<>
						<Typography variant="body2">
							{t("pages.account.team.invite.linkLabel")}
						</Typography>
						<TextField
							value={inviteLink}
							fullWidth
							slotProps={{
								input: {
									readOnly: true,
								},
							}}
						/>
					</>
				)}
			</Stack>
		</Dialog>
	);
};

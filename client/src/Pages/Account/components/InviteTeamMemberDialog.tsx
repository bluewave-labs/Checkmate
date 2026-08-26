import { Stack } from "@mui/material";
import { useTheme, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { Dialog, TextField, Button } from "@/Components/inputs";
import { useInviteForm } from "@/Hooks/useInviteForm";
import type { InviteFormData } from "@/Validation/invite";
import { usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import { runtimeConfig } from "@/Utils/runtimeConfig";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { RoleSelectField } from "./RoleSelectField";

const CLIENT_HOST = runtimeConfig.clientHost || import.meta.env.VITE_APP_CLIENT_HOST;

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

	const form = useForm<InviteFormData>({
		resolver,
		defaultValues: defaults,
		values: defaults,
	});
	const { handleSubmit, reset } = form;

	const { post: generateToken, loading: generateLoading } = usePost<
		InviteFormData,
		InviteResponse
	>();
	const { post: sendInvite, loading: sendLoading } = usePost<
		InviteFormData,
		InviteResponse
	>();
	const [inviteLink, setInviteLink] = useState<string | null>(null);

	const handleGenerateToken = async (data: InviteFormData) => {
		const result = await generateToken("/invite", data);
		if (result?.data?.token) {
			const token = result.data.token;
			const link = `${CLIENT_HOST || window.location.origin}/register/${token}`;
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
		<FormProvider {...form}>
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
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					<FormTextField
						name="email"
						type="email"
						fieldLabel={t("common.form.email.option.email.label")}
						placeholder={t("common.form.email.option.email.placeholder")}
					/>

					<RoleSelectField />
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
		</FormProvider>
	);
};

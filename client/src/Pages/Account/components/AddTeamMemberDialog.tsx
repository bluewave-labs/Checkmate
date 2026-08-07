import { Stack } from "@mui/material";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { Dialog } from "@/Components/inputs";
import { useAddTeamMemberForm } from "@/Hooks/useAddTeamMemberForm";
import type { AddTeamMemberFormData } from "@/Validation/addTeamMember";
import type { User } from "@/Types/User";
import { usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { RoleSelectField } from "./RoleSelectField";

interface AddTeamMemberDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

interface RegisterPayload {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role: string[];
}

export const AddTeamMemberDialog = ({
	open,
	onClose,
	onSuccess,
}: AddTeamMemberDialogProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { schema, defaults } = useAddTeamMemberForm();
	const { post, loading } = usePost<RegisterPayload, User>();

	const form = useForm<AddTeamMemberFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
		values: defaults,
	});

	const { handleSubmit, reset, setError } = form;

	const handleClose = () => {
		reset();
		onClose();
	};

	const onSubmit = async (data: AddTeamMemberFormData) => {
		if (loading) return;

		const { confirm: _confirm, ...userData } = data;
		const payload: RegisterPayload = userData;

		const result = await post("/auth/users", payload);

		if (result?.success) {
			reset();
			onClose();
			onSuccess?.();
		} else if (result?.msg) {
			if (result.msg.toLowerCase().includes("email")) {
				setError("email", { message: result.msg });
			}
		}
	};

	return (
		<FormProvider {...form}>
			<Dialog
				open={open}
				title={t("pages.account.team.addMember.title")}
				content={t("pages.account.team.addMember.description")}
				onCancel={handleClose}
				onConfirm={handleSubmit(onSubmit)}
				confirmText={t("common.buttons.addMember")}
				loading={loading}
				maxWidth="sm"
				fullWidth
			>
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					<Stack
						direction="row"
						gap={theme.spacing(LAYOUT.XS)}
					>
						<FormTextField
							name="firstName"
							fieldLabel={t("common.form.name.option.firstName.label")}
							placeholder={t("common.form.name.option.firstName.placeholder")}
						/>
						<FormTextField
							name="lastName"
							fieldLabel={t("common.form.name.option.lastName.label")}
							placeholder={t("common.form.name.option.lastName.placeholder")}
						/>
					</Stack>
					<FormTextField
						name="email"
						type="email"
						fieldLabel={t("common.form.email.option.email.label")}
						placeholder={t("common.form.email.option.email.placeholder")}
					/>

					<RoleSelectField />

					<Stack
						direction="row"
						gap={theme.spacing(LAYOUT.XS)}
					>
						<FormTextField
							name="password"
							fieldLabel={t("pages.auth.common.form.option.password.label")}
							placeholder={t("pages.auth.common.form.option.password.placeholder")}
							type="password"
							sx={{ flex: 1 }}
						/>

						<FormTextField
							name="confirm"
							fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
							placeholder={t("pages.auth.common.form.option.password.placeholder")}
							type="password"
						/>
					</Stack>
				</Stack>
			</Dialog>
		</FormProvider>
	);
};

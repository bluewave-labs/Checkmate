import { Stack } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { Dialog, TextField, Select } from "@/Components/inputs";
import { useAddTeamMemberForm } from "@/Hooks/useAddTeamMemberForm";
import type { AddTeamMemberFormData } from "@/Validation/addTeamMember";
import type { UserRole, User } from "@/Types/User";
import { usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";

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

	const { control, handleSubmit, reset, setError } = useForm<AddTeamMemberFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
		values: defaults,
	});

	const roleOptions: { value: UserRole; label: string }[] = [
		{ value: "admin", label: t("common.auth.roles.admin") },
		{ value: "user", label: t("common.auth.roles.user") },
		{ value: "demo", label: t("common.auth.roles.demo") },
	];

	const handleClose = () => {
		reset();
		onClose();
	};

	const onSubmit = async (data: AddTeamMemberFormData) => {
		if (loading) return;

		const { confirm, ...userData } = data;
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
					<Controller
						name="firstName"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								fieldLabel={t("common.form.name.option.firstName.label")}
								placeholder={t("common.form.name.option.firstName.placeholder")}
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
								sx={{ flex: 1 }}
							/>
						)}
					/>
					<Controller
						name="lastName"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								fieldLabel={t("common.form.name.option.lastName.label")}
								placeholder={t("common.form.name.option.lastName.placeholder")}
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
								sx={{ flex: 1 }}
							/>
						)}
					/>
				</Stack>
				<Controller
					name="email"
					control={control}
					render={({ field, fieldState }) => (
						<TextField
							{...field}
							fieldLabel={t("common.form.email.option.email.label")}
							placeholder={t("common.form.email.option.email.placeholder")}
							type="email"
							error={!!fieldState.error}
							helperText={fieldState.error?.message ?? ""}
							fullWidth
						/>
					)}
				/>
				<Controller
					name="role"
					control={control}
					render={({ field }) => (
						<Select
							{...field}
							value={field.value[0] ?? "user"}
							onChange={(e) => field.onChange([e.target.value])}
							fieldLabel={t("common.form.role.option.role.label")}
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
					)}
				/>
				<Stack
					direction="row"
					gap={theme.spacing(LAYOUT.XS)}
				>
					<Controller
						name="password"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								fieldLabel={t("pages.auth.common.form.option.password.label")}
								placeholder={t("pages.auth.common.form.option.password.placeholder")}
								type="password"
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
								sx={{ flex: 1 }}
							/>
						)}
					/>
					<Controller
						name="confirm"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
								placeholder={t("pages.auth.common.form.option.password.placeholder")}
								type="password"
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
								sx={{ flex: 1 }}
							/>
						)}
					/>
				</Stack>
			</Stack>
		</Dialog>
	);
};

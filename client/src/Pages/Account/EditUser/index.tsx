import { Trash2 } from "lucide-react";
import { TextField, Button, Autocomplete } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import FormHelperText from "@mui/material/FormHelperText";
import { useForm, Controller } from "react-hook-form";
import { ConfigBox, BasePage } from "@/Components/design-elements";

import { UserRoles } from "@/Types/User";
import { useTranslation } from "react-i18next";
import type { UserRole, User } from "@/Types/User";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material";
import { useEditUserForm } from "@/Hooks/useEditUserForm";
import { useGet, usePatch, useDelete } from "@/Hooks/UseApi";
import type { EditUserFormData } from "@/Validation/editUser";
import { useEffect, useState } from "react";
import { DialogInput } from "@/Components/inputs/Dialog";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

interface RoleOption {
	id: UserRole;
	name: string;
}

const EditUserPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { userId } = useParams<{ userId: string }>();
	const { resolver, defaults } = useEditUserForm();
	const { patch, loading: isSaving } = usePatch();
	const { deleteFn, loading: isDeleting } = useDelete();
	const navigate = useNavigate();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const currentUser = useSelector((state: RootState) => state.auth.user);
	const isSuperAdmin = currentUser?.role?.includes("superadmin") ?? false;
	const isAdmin = isSuperAdmin || (currentUser?.role?.includes("admin") ?? false);

	const { data: user, isLoading } = useGet<User>(`/auth/users/${userId}`);

	const { control, handleSubmit, reset, watch, setValue } = useForm<EditUserFormData>({
		resolver,
		defaultValues: defaults,
	});

	useEffect(() => {
		if (user) {
			reset({
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				role: user.role || [],
			});
		}
	}, [user, reset]);

	const editableRoles = UserRoles.filter((role) => role !== "superadmin");
	const roleOptions: RoleOption[] = editableRoles.map((role) => ({
		id: role,
		name: t(`common.auth.roles.${role}`),
	}));

	const watchedRoles = watch("role");
	const selectedRoles = roleOptions.filter((r) => watchedRoles?.includes(r.id));
	const handleRemoveRole = (roleToRemove: UserRole) => {
		const newRoles = watchedRoles.filter((role) => role !== roleToRemove);
		setValue("role", newRoles, { shouldValidate: true });
	};

	const canDeleteUser =
		isAdmin &&
		userId !== currentUser?.id &&
		!user?.role?.includes("demo") &&
		(isSuperAdmin || user?.role?.every((r) => r !== "admin" && r !== "superadmin"));

	const handleDeleteUser = async () => {
		const result = await deleteFn(`/auth/users/${userId}`);
		if (result) {
			setShowDeleteDialog(false);
			navigate("/account", { state: { tab: "team" } });
		}
	};

	const onSubmit = async (data: EditUserFormData) => {
		await patch(`/auth/users/${userId}`, data);
	};

	return (
		<BasePage loading={isLoading}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack gap={theme.spacing(8)}>
					<ConfigBox
						title={t("pages.account.form.name.title")}
						subtitle={t("pages.account.form.name.description")}
						rightContent={
							<Stack gap={theme.spacing(8)}>
								<Controller
									name="firstName"
									control={control}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											fieldLabel={t("common.form.name.option.firstName.label")}
											placeholder={t("common.form.name.option.firstName.placeholder")}
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
											autoComplete="given-name"
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
											helperText={fieldState.error?.message}
											autoComplete="family-name"
										/>
									)}
								/>
								<TextField
									fieldLabel={t("common.form.email.option.email.label")}
									placeholder={t("common.form.email.option.email.placeholder")}
									value={user?.email || ""}
									disabled
								/>
							</Stack>
						}
					/>
					<ConfigBox
						title={t("pages.editUser.form.roles.title")}
						subtitle={t("pages.editUser.form.roles.description")}
						rightContent={
							<Stack spacing={theme.spacing(4)}>
								<Controller
									name="role"
									control={control}
									render={({ field, fieldState }) => (
										<>
											<Autocomplete
												fieldLabel={t("common.form.role.option.role.label")}
												multiple
												options={roleOptions}
												value={selectedRoles}
												getOptionLabel={(option) => option.name}
												onChange={(_: unknown, newValue: RoleOption[]) => {
													field.onChange(newValue.map((r) => r.id));
												}}
												isOptionEqualToValue={(option, value) => option.id === value.id}
											/>
											{fieldState.error && (
												<FormHelperText error>{fieldState.error.message}</FormHelperText>
											)}
										</>
									)}
								/>
								{selectedRoles.length > 0 && (
									<Stack
										flex={1}
										width="100%"
									>
										{selectedRoles.map((role, index) => (
											<Stack
												direction="row"
												alignItems="center"
												key={role.id}
												width="100%"
											>
												<Typography flexGrow={1}>{role.name}</Typography>
												<IconButton
													size="small"
													onClick={() => handleRemoveRole(role.id)}
													aria-label="Remove role"
												>
													<Trash2 size={16} />
												</IconButton>
												{index < selectedRoles.length - 1 && <Divider />}
											</Stack>
										))}
									</Stack>
								)}
							</Stack>
						}
					/>
					<Stack
						gap={LAYOUT.XS}
						direction="row"
						justifyContent={"flex-end"}
						width="100%"
					>
						{canDeleteUser && (
							<Button
								variant="contained"
								color="error"
								onClick={() => setShowDeleteDialog(true)}
								sx={{ minWidth: 100 }}
							>
								{t("common.buttons.removeUser")}
							</Button>
						)}
						<Button
							type="submit"
							variant="contained"
							color="primary"
							loading={isSaving}
							sx={{ minWidth: 100 }}
						>
							{t("common.buttons.save")}
						</Button>
					</Stack>
				</Stack>
			</form>
			<DialogInput
				open={showDeleteDialog}
				title={t("pages.editUser.dialog.removeUser.title")}
				content={t("pages.editUser.dialog.removeUser.content", {
					name: `${user?.firstName} ${user?.lastName}`,
				})}
				onCancel={() => setShowDeleteDialog(false)}
				onConfirm={handleDeleteUser}
				confirmText={t("common.buttons.removeUser")}
				loading={isDeleting}
			/>
		</BasePage>
	);
};

export default EditUserPage;

import { TextField, Button } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { FormProvider, useForm } from "react-hook-form";
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
import { LAYOUT } from "@/Utils/Theme/constants";
import { useIsAdmin, useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormMultiSelectField } from "@/Components/inputs/forms/FormMultiSelectField";

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
	const isSuperAdmin = useIsSuperAdmin();
	const isAdmin = useIsAdmin();

	const { data: user, isLoading } = useGet<User>(`/auth/users/${userId}`);

	const form = useForm<EditUserFormData>({
		resolver,
		defaultValues: defaults,
	});
	const { handleSubmit, reset } = form;

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

	const canDeleteUser =
		isAdmin &&
		userId !== currentUser?.id &&
		!user?.role?.includes("demo") &&
		(isSuperAdmin || user?.role?.every((r) => r !== "admin" && r !== "superadmin"));

	const handleDeleteUser = async () => {
		const result = await deleteFn(`/auth/users/${userId}`);
		setShowDeleteDialog(false);
		if (result) {
			navigate("/account", { state: { tab: "team" } });
		}
	};

	const onSubmit = async (data: EditUserFormData) => {
		await patch(`/auth/users/${userId}`, data);
	};

	return (
		<FormProvider {...form}>
			<BasePage
				loading={isLoading}
				component={"form"}
				onSubmit={handleSubmit(onSubmit)}
			>
				<Stack gap={theme.spacing(8)}>
					<ConfigBox
						title={t("pages.account.form.name.title")}
						subtitle={t("pages.account.form.name.description")}
						rightContent={
							<Stack gap={theme.spacing(8)}>
								<FormTextField
									name="firstName"
									autoComplete="given-name"
									fieldLabel={t("common.form.name.option.firstName.label")}
									placeholder={t("common.form.name.option.firstName.placeholder")}
								/>
								<FormTextField
									name="lastName"
									autoComplete="family-name"
									fieldLabel={t("common.form.name.option.lastName.label")}
									placeholder={t("common.form.name.option.lastName.placeholder")}
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
							<FormMultiSelectField
								name="role"
								fieldLabel={t("common.form.role.option.role.label")}
								options={roleOptions}
							/>
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
		</FormProvider>
	);
};

export default EditUserPage;

// Components
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import TextInput from "../../../Components/Inputs/TextInput";
import Search from "../../../Components/Inputs/Search";
import Button from "@mui/material/Button";
import RoleTable from "../components/RoleTable";

// Utils
import { useParams } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useGetUser, useEditUser } from "../../../Hooks/userHooks";
import { EDITABLE_ROLES, ROLES } from "../../../Utils/roleUtils";
import { useEditUserForm, useValidateEditUserForm } from "./hooks/editUser";

const EditUser = () => {
	const { userId } = useParams();
	const theme = useTheme();
	const { t } = useTranslation();
	const BREADCRUMBS = [
		{ name: t("menu.team"), path: "/account/team" },
		{ name: t("editUserPage.title"), path: "" },
	];

	const [user, isLoading, error] = useGetUser(userId);
	const [editUser, isSaving, saveError] = useEditUser(userId);
	const [
		form,
		setForm,
		handleRoleChange,
		handleDeleteRole,
		searchInput,
		handleSearchInput,
	] = useEditUserForm(user);
	const [errors, validateForm, validateField] = useValidateEditUserForm();

	const onChange = (e) => {
		const name = e.target.name;
		const value = e.target.value;
		validateField(name, value);
		setForm({ ...form, [name]: value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const valid = validateForm(form);
		if (valid) {
			editUser(form);
		}
	};

	return (
		<Stack gap={theme.spacing(20)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h2">{t("editUserPage.title")}</Typography>
			<Stack
				component="form"
				onSubmit={handleSubmit}
				gap={theme.spacing(12)}
				maxWidth="50%"
			>
				<TextInput
					name="firstName"
					label={t("editUserPage.form.firstName")}
					value={form?.firstName}
					onChange={onChange}
					error={errors?.firstName ? true : false}
					helperText={t(errors?.firstName)}
				/>
				<TextInput
					name="lastName"
					label={t("editUserPage.form.lastName")}
					value={form?.lastName}
					onChange={onChange}
					error={errors?.lastName ? true : false}
					helperText={t(errors?.lastName)}
				/>
				<TextInput
					name="email"
					label={t("editUserPage.form.email")}
					value={form?.email}
					disabled={true}
					error={errors?.email ? true : false}
					helperText={t(errors?.email)}
				/>
				<Search
					label={t("editUserPage.form.role")}
					filteredBy="role"
					inputValue={searchInput}
					handleInputChange={handleSearchInput}
					value={
						form?.role
							?.filter((role) => role !== ROLES.SUPERADMIN)
							.map((role) => ({ role, _id: role })) || []
					}
					options={EDITABLE_ROLES}
					multiple={true}
					handleChange={handleRoleChange}
				/>
				<RoleTable
					roles={form?.role}
					handleDeleteRole={handleDeleteRole}
				/>
				<Box>
					<Button
						type="submit"
						variant="contained"
						color="accent"
						loading={isLoading || isSaving}
					>
						{t("editUserPage.form.save")}
					</Button>
				</Box>
			</Stack>
		</Stack>
	);
};

export default EditUser;

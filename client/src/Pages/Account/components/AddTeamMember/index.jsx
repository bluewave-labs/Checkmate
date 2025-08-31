import { Button, Stack } from "@mui/material";
import { GenericDialog } from "../../../../Components/Dialog/genericDialog";
import TextInput from "../../../../Components/Inputs/TextInput";
import Select from "../../../../Components/Inputs/Select";
import { useGetInviteToken } from "../../../../Hooks/inviteHooks";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";
import { useState } from "react";
import PasswordTooltip from "../../../Auth/components/PasswordTooltip";
import useAddTeamMember from "./hooks/useAddTeamMember";
import usePasswordFeedback from "../../../Auth/hooks/usePasswordFeedback";
import { PasswordEndAdornment } from "../../../../Components/Inputs/TextInput/Adornments";
import PropTypes from "prop-types";
const INITIAL_FORM_STATE = {
	firstName: "",
	lastName: "",
	email: "",
	password: "",
	confirm: "",
	teamId: "",
};

const INITIAL_ROLE_STATE = ["user"];
const AddTeamMember = ({ handleIsRegisterOpen, isRegisterOpen, onMemberAdded }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { errors, setErrors, clearErrors, validateFields, validateForm } =
		useAddTeamMember();
	const { feedback, handlePasswordFeedback } = usePasswordFeedback();
	const [getInviteToken, clearToken, isLoading, error, token, addTeamMember] =
		useGetInviteToken();
	const [form, setForm] = useState(INITIAL_FORM_STATE);
	const [role, setRole] = useState(INITIAL_ROLE_STATE);
	const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
	const closeAddMemberModal = () => {
		handleIsRegisterOpen(false);
		setForm(INITIAL_FORM_STATE);
		setRole(INITIAL_ROLE_STATE);
		clearErrors();
		clearToken();
	};

	const onChange = (e) => {
		let { name, value } = e.target;
		if (name === "email") value = value.toLowerCase();
		const updatedForm = { ...form, [name]: value };
		validateFields(name, value, updatedForm);
		setForm(updatedForm);

		if (name === "password" || name === "confirm") {
			handlePasswordFeedback(updatedForm, name, value, form, errors, setErrors);
		}
	};

	const onsubmitAddMember = async (event) => {
		event.preventDefault();
		if (!validateForm(form, role)) return;
		setIsLoadingSubmit(true);
		try {
			await addTeamMember(form, role);
			createToast({
				body: t("teamPanel.registerToast.success"),
			});
			onMemberAdded();
			closeAddMemberModal();
		} catch (error) {
			const errorMsg = error.response?.data?.msg || error.message || "unknownError";
			createToast({
				type: "error",
				body: t(errorMsg),
			});
		} finally {
			setIsLoadingSubmit(false);
		}
	};
	const tErr = (key) => (key ? t([`teamPanel.registerTeamMember.${key}`, key]) : "");
	return (
		<>
			<GenericDialog
				title={t("teamPanel.addTeamMember.title")}
				description={t("teamPanel.addTeamMember.description")}
				open={isRegisterOpen}
				onClose={closeAddMemberModal}
				theme={theme}
				width={{ sm: "55%", md: "50%", lg: "40%", xl: "30%" }}
			>
				<TextInput
					name="firstName"
					label={t("auth.common.inputs.firstName.label")}
					isRequired={true}
					gap={theme.spacing(4)}
					placeholder={t("auth.common.inputs.firstName.placeholder")}
					value={form.firstName}
					onChange={onChange}
					error={errors.firstName ? true : false}
					helperText={errors.firstName ? tErr(errors.firstName) : null}
					sx={{ mb: errors.firstName ? theme.spacing(15) : theme.spacing(5) }}
				/>

				<TextInput
					name="lastName"
					label={t("auth.common.inputs.lastName.label")}
					isRequired={true}
					gap={theme.spacing(4)}
					placeholder={t("auth.common.inputs.lastName.placeholder")}
					value={form.lastName}
					onChange={onChange}
					error={errors.lastName ? true : false}
					helperText={errors.lastName ? tErr(errors.lastName) : null}
					sx={{ mb: errors.lastName ? theme.spacing(15) : theme.spacing(5) }}
				/>

				<TextInput
					type="email"
					label={t("auth.common.inputs.email.label")}
					name="email"
					gap={theme.spacing(4)}
					isRequired={true}
					id="input-team-member"
					placeholder={t("teamPanel.email")}
					value={form.email}
					onChange={onChange}
					error={errors.email ? true : false}
					helperText={errors.email ? tErr(errors.email) : null}
					sx={{ mb: errors.email ? theme.spacing(15) : theme.spacing(5) }}
				/>

				<Select
					label={t("teamPanel.role")}
					id="team-member-role"
					name="role"
					required={true}
					placeholder={t("teamPanel.selectRole")}
					isHidden={true}
					value={role[0] || ""}
					sx={{ mb: theme.spacing(5) }}
					onChange={(event) => setRole([event.target.value])}
					items={[
						{ _id: "admin", name: t("roles.admin") },
						{ _id: "user", name: t("roles.teamMember") },
					]}
				/>

				<PasswordTooltip
					feedback={feedback}
					form={form}
				>
					<TextInput
						type="password"
						id="register-password-input"
						name="password"
						label={t("auth.common.inputs.password.label")}
						isRequired={true}
						placeholder="••••••••••"
						value={form.password}
						onChange={onChange}
						error={errors.password && errors.password[0] ? true : false}
						endAdornment={<PasswordEndAdornment />}
						sx={{ mb: theme.spacing(5) }}
					/>
				</PasswordTooltip>
				<TextInput
					type="password"
					id="register-confirm-input"
					name="confirm"
					label={t("auth.common.inputs.passwordConfirm.label")}
					gap={theme.spacing(4)}
					isRequired={true}
					placeholder={t("auth.common.inputs.passwordConfirm.placeholder")}
					autoComplete="current-password"
					value={form.confirm}
					onChange={onChange}
					error={errors.confirm && errors.confirm[0] ? true : false}
					endAdornment={<PasswordEndAdornment />}
					sx={{ mb: theme.spacing(5) }}
				/>

				<Stack
					direction="row"
					spacing={theme.spacing(10)}
					mt={theme.spacing(8)}
					justifyContent="flex-end"
				>
					<Button
						variant="contained"
						color="error"
						onClick={closeAddMemberModal}
						disabled={isLoadingSubmit}
					>
						{t("teamPanel.cancel")}
					</Button>
					<Button
						variant="contained"
						color="accent"
						onClick={onsubmitAddMember}
						disabled={isLoadingSubmit}
					>
						{t("teamPanel.addTeamMember.addButton")}
					</Button>
				</Stack>
			</GenericDialog>
		</>
	);
};
AddTeamMember.propTypes = {
	handleIsRegisterOpen: PropTypes.func.isRequired,
	isRegisterOpen: PropTypes.bool.isRequired,
	onMemberAdded: PropTypes.func.isRequired,
};

export default AddTeamMember;

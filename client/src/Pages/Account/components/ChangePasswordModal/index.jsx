import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { GenericDialog } from "@/Components/v1/Dialog/genericDialog";
import TextInput from "@/Components/v1/Inputs/TextInput";
import PasswordTooltip from "@/Pages/v1/Auth/components/PasswordTooltip";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";
import { PasswordEndAdornment } from "@/Components/v1/Inputs/TextInput/Adornments";
import usePasswordFeedback from "@/Pages/v1/Auth/hooks/usePasswordFeedback";
import PropTypes from "prop-types";

const ChangePasswordModal = ({ isSaving, isLoading, changePassword }) => {
	const INITIAL_FORM_STATE = {
		password: "",
		confirm: "",
	};
	const theme = useTheme();
	const { t } = useTranslation();
	const { feedback, handlePasswordFeedback } = usePasswordFeedback();
	const [form, setForm] = useState(INITIAL_FORM_STATE);
	const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
	const [errors, setErrors] = useState({});
	const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
	const closeChangePasswordModal = () => {
		setIsChangePasswordOpen(false);
		setForm(INITIAL_FORM_STATE);
	};

	const onChange = (e) => {
		let { name, value } = e.target;
		const updatedForm = { ...form, [name]: value };
		setForm(updatedForm);

		handlePasswordFeedback(updatedForm, name, value, form, errors, setErrors);
	};
	const isFormValid =
		form.password.length > 1 &&
		form.confirm.length > 1 &&
		!errors.password &&
		!errors.confirm;
	const onsubmitChangePassword = async (event) => {
		event.preventDefault();
		if (!isFormValid) return;
		const newPasswordForm = {
			password: form.password,
		};
		try {
			setIsLoadingSubmit(true);
			await changePassword(newPasswordForm);
			closeChangePasswordModal();
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

	return (
		<>
			<Button
				variant="contained"
				color="error"
				onClick={() => setIsChangePasswordOpen(true)}
				disabled={isLoading || isSaving}
			>
				{t("teamPanel.changeTeamPassword.changePasswordMenu")}
			</Button>
			<GenericDialog
				title={t("teamPanel.changeTeamPassword.title")}
				description={t("teamPanel.changeTeamPassword.description")}
				open={isChangePasswordOpen}
				onClose={closeChangePasswordModal}
				theme={theme}
				width={{ sm: "55%", md: "50%", lg: "40%", xl: "30%" }}
			>
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
						onClick={closeChangePasswordModal}
						disabled={isLoadingSubmit}
					>
						{t("teamPanel.cancel")}
					</Button>
					<Button
						variant="contained"
						color="accent"
						onClick={onsubmitChangePassword}
						disabled={isLoadingSubmit || !isFormValid}
					>
						{t("save")}
					</Button>
				</Stack>
			</GenericDialog>
		</>
	);
};

ChangePasswordModal.propTypes = {
	isSaving: PropTypes.bool.isRequired,
	isLoading: PropTypes.bool.isRequired,
	changePassword: PropTypes.func.isRequired,
};

export default ChangePasswordModal;

// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextInput from "../../../Components/Inputs/TextInput";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import PasswordTooltip from "../components/PasswordTooltip";

// Utils
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { networkService } from "../../../main";
import { newOrChangedCredentials } from "../../../Validation/validation";
import { register } from "../../../Features/Auth/authSlice";
import AuthPageWrapper from "../components/AuthPageWrapper";
import { createToast } from "../../../Utils/toastUtils";
import PropTypes from "prop-types";

const getFeedbackStatus = (form, errors, field, criteria) => {
	const fieldErrors = errors?.[field];
	const isFieldEmpty = form?.[field]?.length === 0;
	const hasError = fieldErrors?.includes(criteria) || fieldErrors?.includes("empty");
	const isCorrect = !isFieldEmpty && !hasError;

	if (isCorrect) {
		return "success";
	} else if (hasError) {
		return "error";
	} else {
		return "info";
	}
};

const Register = ({ superAdminExists }) => {
	// Redux
	const { isLoading } = useSelector((state) => state.auth);

	// Local state
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirm: "",
		role: [],
		teamId: "",
	});

	const [errors, setErrors] = useState({});
	const [feedback, setFeedback] = useState({});

	// Hooks
	const theme = useTheme();
	const { t } = useTranslation();
	const { token } = useParams();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	// Effects
	useEffect(() => {
		const fetchInvite = async () => {
			if (token !== undefined) {
				try {
					const res = await networkService.verifyInvitationToken(token);
					const invite = res.data.data;
					const { email } = invite;
					setForm((prevForm) => {
						if (!prevForm.email) {
							return { ...prevForm, email };
						}
						return prevForm;
					});
				} catch (error) {
					navigate("/register", { replace: true });
				}
			}
		};
		fetchInvite();
	}, [form, token, navigate]);

	// Handlers
	const onChange = (e) => {
		let { name, value } = e.target;
		if (name === "email") value = value.toLowerCase();
		const updatedForm = { ...form, [name]: value };

		const { error } = newOrChangedCredentials.validate(
			{ [name]: value },
			{ abortEarly: false, context: { password: form.password } }
		);

		setErrors((prev) => ({
			...prev,
			[name]: error?.details?.[0]?.message || "",
		}));

		setForm(updatedForm);
	};

	const onPasswordChange = (e) => {
		const { name, value } = e.target;
		const updatedForm = { ...form, [name]: value };
		setForm(updatedForm);
		const validateValue = { [name]: value };
		const validateOptions = { abortEarly: false, context: { password: form.password } };
		if (name === "password" && form.confirm.length > 0) {
			validateValue.confirm = form.confirm;
			validateOptions.context = { password: value };
		} else if (name === "confirm") {
			validateValue.password = form.password;
		}
		const { error } = newOrChangedCredentials.validate(validateValue, validateOptions);

		const pwdErrors = error?.details.map((error) => ({
			path: error.path[0],
			type: error.type,
		}));

		const errorsByPath =
			pwdErrors &&
			pwdErrors.reduce((acc, { path, type }) => {
				if (!acc[path]) {
					acc[path] = [];
				}
				acc[path].push(type);
				return acc;
			}, {});

		const oldErrors = { ...errors };
		if (name === "password") {
			oldErrors.password = undefined;
		} else if (name === "confirm") {
			oldErrors.confirm = undefined;
		}
		const newErrors = { ...oldErrors, ...errorsByPath };

		setErrors(newErrors);

		const newFeedback = {
			length: getFeedbackStatus(updatedForm, errorsByPath, "password", "string.min"),
			special: getFeedbackStatus(updatedForm, errorsByPath, "password", "special"),
			number: getFeedbackStatus(updatedForm, errorsByPath, "password", "number"),
			uppercase: getFeedbackStatus(updatedForm, errorsByPath, "password", "uppercase"),
			lowercase: getFeedbackStatus(updatedForm, errorsByPath, "password", "lowercase"),
			confirm: getFeedbackStatus(updatedForm, errorsByPath, "confirm", "different"),
		};

		setFeedback(newFeedback);
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		const toSubmit = {
			...form,
			role: superAdminExists ? form.role : ["superadmin"],
			inviteToken: token ? token : "",
		};

		const { error } = newOrChangedCredentials.validate(toSubmit, {
			abortEarly: false,
			context: { password: form.password },
		});

		if (error) {
			const formErrors = {};
			for (const err of error.details) {
				formErrors[err.path[0]] = err.message;
			}
			setErrors(formErrors);
			return;
		}

		delete toSubmit.confirm;

		const action = await dispatch(register(toSubmit));
		if (action.payload.success) {
			navigate("/uptime");
			createToast({
				body: t("auth.registration.toasts.success"),
			});
		} else {
			if (action.payload) {
				createToast({
					body: action.payload.msg,
				});
			} else {
				createToast({
					body: t("common.toasts.unknownError"),
				});
			}
		}
	};

	return (
		<AuthPageWrapper
			heading={t("auth.registration.heading.user")}
			welcome={t("auth.registration.welcome")}
		>
			<Stack
				component="form"
				width="100%"
				padding={theme.spacing(8)}
				gap={theme.spacing(8)}
				onSubmit={onSubmit}
				sx={{
					width: {
						sm: "80%",
					},
				}}
			>
				<Typography variant="h2">
					{superAdminExists
						? t("auth.registration.description.user")
						: t("auth.registration.description.superAdmin")}
				</Typography>
				<Stack
					direction={{ xs: "column", lg: "row" }}
					justifyContent="space-between"
					gap={theme.spacing(4)}
				>
					<TextInput
						name="firstName"
						sx={{ flex: 1 }}
						label={t("auth.common.inputs.firstName.label")}
						width="100%"
						gap={theme.spacing(4)}
						isRequired={true}
						placeholder={t("auth.common.inputs.firstName.placeholder")}
						autoComplete="given-name"
						value={form.firstName}
						onChange={onChange}
						error={errors.firstName ? true : false}
						helperText={errors.firstName ? t(errors.firstName) : ""}
					/>
					<TextInput
						name="lastName"
						label={t("auth.common.inputs.lastName.label")}
						sx={{ flex: 1 }}
						width="100%"
						gap={theme.spacing(4)}
						isRequired={true}
						placeholder={t("auth.common.inputs.lastName.placeholder")}
						autoComplete="family-name"
						value={form.lastName}
						onChange={onChange}
						error={errors.lastName ? true : false}
						helperText={errors.lastName ? t(errors.lastName) : ""} // Localization keys are in validation.js
					/>
				</Stack>
				<TextInput
					type="email"
					name="email"
					gap={theme.spacing(4)}
					label={t("auth.common.inputs.email.label")}
					isRequired={true}
					placeholder={t("auth.common.inputs.email.placeholder")}
					autoComplete="email"
					value={form.email}
					onInput={(e) => (e.target.value = e.target.value.toLowerCase())}
					onChange={onChange}
					error={errors.email ? true : false}
					helperText={errors.email ? t(errors.email) : ""} // Localization keys are in validation.js
				/>
				<PasswordTooltip
					feedback={feedback}
					form={form}
				>
					<Box>
						<TextInput
							type="password"
							id="register-password-input"
							name="password"
							label={t("auth.common.inputs.password.label")}
							gap={theme.spacing(4)}
							isRequired={true}
							placeholder="••••••••••"
							autoComplete="current-password"
							value={form.password}
							onChange={onPasswordChange}
							error={errors.password && errors.password[0] ? true : false}
							helperText={
								errors.password === "auth.common.inputs.password.errors.empty"
									? t(errors.password)
									: ""
							}
						/>
					</Box>
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
					onChange={onPasswordChange}
					marginBottom={theme.spacing(4)}
					error={errors.confirm && errors.confirm[0] ? true : false}
				/>
				<Button
					disabled={isLoading}
					variant="contained"
					color="accent"
					type="submit"
					sx={{
						width: "100%",
						alignSelf: "center",
						fontWeight: 700,
						mt: theme.spacing(10),
					}}
				>
					{t("auth.common.navigation.continue")}
				</Button>
			</Stack>
		</AuthPageWrapper>
	);
};

Register.propTypes = {
	superAdminExists: PropTypes.bool,
};

export default Register;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { credentials } from "../../../Validation/validation";
import { login } from "../../../Features/Auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { createToast } from "../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";
import { networkService } from "../../../main";
import Background from "../../../assets/Images/background-grid.svg?react";
import Logo from "../../../assets/icons/checkmate-icon.svg?react";
import { logger } from "../../../Utils/Logger";
import "../index.css";
import EmailStep from "./Components/EmailStep";
import PasswordStep from "./Components/PasswordStep";
import ThemeSwitch from "../../../Components/ThemeSwitch";
import ForgotPasswordLabel from "./Components/ForgotPasswordLabel";
import LanguageSelector from "../../../Components/LanguageSelector";

const DEMO = import.meta.env.VITE_APP_DEMO;

/**
 * Displays the login page.
 */

const Login = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const authState = useSelector((state) => state.auth);
	const { authToken } = authState;

	const idMap = {
		"login-email-input": "email",
		"login-password-input": "password",
	};

	const [form, setForm] = useState({
		email: DEMO !== undefined ? "uptimedemo@demo.com" : "",
		password: DEMO !== undefined ? "Demouser1!" : "",
	});
	const [errors, setErrors] = useState({});
	const [step, setStep] = useState(0);

	useEffect(() => {
		if (authToken) {
			navigate("/uptime");
			return;
		}
		networkService
			.doesSuperAdminExist()
			.then((response) => {
				if (response.data.data === false) {
					navigate("/register");
				}
			})
			.catch((error) => {
				logger.error(error);
			});
	}, [authToken, navigate]);

	const handleChange = (event) => {
		const { value, id } = event.target;
		const name = idMap[id];
		const lowerCasedValue = name === idMap["login-email-input"]? value?.toLowerCase()||value : value
		setForm((prev) => ({
			...prev,
			[name]: lowerCasedValue,
		}));

		const { error } = credentials.validate({ [name]: lowerCasedValue }, { abortEarly: false });

		setErrors((prev) => {
			const prevErrors = { ...prev };
			if (error) prevErrors[name] = error.details[0].message;
			else delete prevErrors[name];
			return prevErrors;
		});
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (step === 0) {
			const { error } = credentials.validate(
				{ email: form.email },
				{ abortEarly: false }
			);
			if (error) {
				const errorMessage = error.details[0].message;
				const translatedMessage = errorMessage.startsWith('auth') ? t(errorMessage) : errorMessage;
				setErrors((prev) => ({ ...prev, email: translatedMessage }));
				createToast({ body: translatedMessage });
			} else {
				setStep(1);
			}
		} else if (step === 1) {
			const { error } = credentials.validate(form, { abortEarly: false });

			if (error) {
				// validation errors
				const newErrors = {};
				error.details.forEach((err) => {
					newErrors[err.path[0]] = err.message;
				});
				setErrors(newErrors);
				createToast({
					body:
						error.details && error.details.length > 0
							? (error.details[0].message.startsWith('auth') ? t(error.details[0].message) : error.details[0].message)
							: t("Error validating data."),
				});
			} else {
				const action = await dispatch(login(form));
				if (action.payload.success) {
					navigate("/uptime");
					createToast({
						body: "Welcome back! You're successfully logged in.",
					});
				} else {
					if (action.payload) {
						if (action.payload.msg === "Incorrect password")
							setErrors({
								password: "The password you provided does not match our records",
							});
						// dispatch errors
						createToast({
							body: action.payload.msg,
						});
					} else {
						// unknown errors
						createToast({
							body: "Unknown error.",
						});
					}
				}
			}
		}
	};

	return (
		<Stack
			className="login-page auth"
			overflow="hidden"
			sx={{
				"& h1": {
					color: theme.palette.primary.contrastText,
					fontWeight: 600,
					fontSize: 28,
				},
				/* TODO set font size from theme */
				"& p": { fontSize: 14, color: theme.palette.primary.contrastTextSecondary },
				"& span": { fontSize: "inherit" },
			}}
		>
			<Box
				className="background-pattern-svg"
				sx={{
					"& svg g g:last-of-type path": {
						stroke: theme.palette.primary.lowContrast,
					},
				}}
			>
				<Background style={{ width: "100%" }} />
			</Box>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				px={theme.spacing(12)}
				gap={theme.spacing(4)}
			>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(4)}
				>
					<Logo style={{ borderRadius: theme.shape.borderRadius }} />
					<Typography sx={{ userSelect: "none" }}>Checkmate</Typography>
				</Stack>
				<Stack
					direction="row"
					spacing={2}
					alignItems="center"
				>
					<LanguageSelector />
					<ThemeSwitch />
				</Stack>
			</Stack>
			<Stack
				width="100%"
				maxWidth={600}
				flex={1}
				justifyContent="center"
				px={{ xs: theme.spacing(12), lg: theme.spacing(20) }}
				pb={theme.spacing(20)}
				mx="auto"
				rowGap={theme.spacing(8)}
				sx={{
					"& > .MuiStack-root": {
						border: 1,
						borderRadius: theme.spacing(5),
						borderColor: theme.palette.primary.lowContrast,
						backgroundColor: theme.palette.primary.main,
						padding: {
							xs: theme.spacing(12),
							sm: theme.spacing(20),
						},
					},
				}}
			>
				{step === 0 ? (
					<EmailStep
						form={form}
						errors={errors}
						onSubmit={handleSubmit}
						onChange={handleChange}
					/>
				) : (
					step === 1 && (
						<PasswordStep
							form={form}
							errors={errors}
							onSubmit={handleSubmit}
							onChange={handleChange}
							onBack={() => setStep(0)}
						/>
					)
				)}
				<ForgotPasswordLabel
					email={form.email}
					errorEmail={errors.email}
				/>
			</Stack>
		</Stack>
	);
};

export default Login;

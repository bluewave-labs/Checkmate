import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, Button } from "@mui/material";
import Alert from "../../../Components/Alert";
import { useTheme } from "@emotion/react";
import { credentials } from "../../../Validation/validation";
import { login } from "../../../Features/Auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { createToast } from "../../../Utils/toastUtils";
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
import { useTranslation } from "react-i18next";

const DEMO = import.meta.env.VITE_APP_DEMO;

/**
 * Displays the login page.
 */

const Login = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const { t } = useTranslation();

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

	// State variables for backend connectivity status and loading state
	const [backendReachable, setBackendReachable] = useState(true);
	const [isCheckingConnection, setIsCheckingConnection] = useState(false);
	const [initialCheckComplete, setInitialCheckComplete] = useState(false);

	// Function to check if the backend server is reachable and handle connectivity status
	// Wrapped in useCallback to prevent recreation on each render
	const checkConnectivity = useCallback(async (isRetry = false) => {
		setIsCheckingConnection(true);
		try {
			const isReachable = await networkService.checkBackendReachability();
			setBackendReachable(isReachable);
			
			// Early return if backend is not reachable
			if (isReachable === false) {
				// Show toast only on retry attempts
				if (isRetry) {
					createToast({
						body: t("backendStillUnreachable"),
					});
				}
				return;
			}
			
			// Show reconnection toast if this was a retry attempt and backend is now reachable
			if (isRetry) {
				createToast({
					body: t("backendReconnected"),
				});
			}
		} catch (error) {
			logger.error("Error checking backend connectivity:", error);
			setBackendReachable(false);
			
			if (isRetry) {
				createToast({
					body: t("backendConnectionError"),
				});
			}
		} finally {
			setIsCheckingConnection(false);
			setInitialCheckComplete(true);
		}
	}, [t]); // Removed navigate since we no longer use it within this function
	
	// Function to handle retry button click
	const handleRetry = () => checkConnectivity(true);

	useEffect(() => {
		if (authToken) {
			navigate("/uptime");
			return;
		}
		
		// Initial connectivity check
		checkConnectivity();
	}, [authToken, navigate, checkConnectivity]);

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
		
		// Check backend connectivity before proceeding
		if (!backendReachable) {
			createToast({
				body: t("backendUnreachableError"),
			});
			return;
		}

		if (step === 0) {
			const { error } = credentials.validate(
				{ email: form.email },
				{ abortEarly: false }
			);
			if (error) {
				setErrors((prev) => ({ ...prev, email: error.details[0].message }));
				createToast({ body: error.details[0].message });
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
							? error.details[0].message
							: "Error validating data.",
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
				{!initialCheckComplete ? (
					<Stack spacing={theme.spacing(6)} alignItems="center">
						{/* Show loading state while doing initial connectivity check */}
						<Typography variant="h1">{t("retryingConnection")}</Typography>
					</Stack>
				) : !backendReachable ? (
					<Stack spacing={theme.spacing(6)} alignItems="center">
						<Box sx={{ 
								width: theme.spacing(220), 
								mx: 'auto', 
								'& .alert.row-stack': { 
									width: '100%',
									alignItems: 'center',
									gap: theme.spacing(3)
								} 
							}}>
							<Alert 
								variant="error"
								body={t("backendUnreachable")}
								hasIcon={true}
							/>
						</Box>
						<Box mt={theme.spacing(2)}>
							<Typography 
								variant="body1" 
								align="center"
								color={theme.palette.primary.contrastTextSecondary}
							>
								{t("backendUnreachableMessage")}
							</Typography>
						</Box>
						<Box sx={{ mt: theme.spacing(4) }}>
							<Button 
								variant="contained" 
								color="accent" 
								onClick={handleRetry}
								disabled={isCheckingConnection}
								loading={isCheckingConnection}
								className="dashboard-style-button"
								sx={{ 
									px: theme.spacing(6),
									borderRadius: `${theme.shape.borderRadius}px !important`,
									'&.MuiButtonBase-root': {
										borderRadius: `${theme.shape.borderRadius}px !important`
									},
									'&.MuiButton-root': {
										borderRadius: `${theme.shape.borderRadius}px !important`
									}
								}}
							>
								{isCheckingConnection ? t("retryingConnection") : t("retryConnection")}
							</Button>
						</Box>
					</Stack>
				) : step === 0 ? (
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
				{backendReachable && (
					<>
						<ForgotPasswordLabel
							email={form.email}
							errorEmail={errors.email}
						/>
						
						{/* Registration link */}
						<Box textAlign="center" >
							<Typography
								className="forgot-p"
								display="inline-block"
								color={theme.palette.primary.main}
							>
								{t("doNotHaveAccount")}
							</Typography>
							<Typography
								component="span"
								color={theme.palette.accent.main}
								ml={theme.spacing(2)}
								sx={{ 
									cursor: 'pointer',
									'&:hover': {
										color: theme.palette.accent.darker
									}
								}}
								onClick={() => navigate("/register")}
							>
								{t("registerHere")}
							</Typography>
						</Box>
					</>
				)}
			</Stack>
		</Stack>
	);
};

export default Login;

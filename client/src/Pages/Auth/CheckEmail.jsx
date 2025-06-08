import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { createToast } from "../../Utils/toastUtils";
import { forgotPassword } from "../../Features/Auth/authSlice";
import { Trans, useTranslation } from "react-i18next";
import Background from "../../assets/Images/background-grid.svg?react";
import EmailIcon from "../../assets/icons/email.svg?react";
import Logo from "../../assets/icons/checkmate-icon.svg?react";
import IconBox from "../../Components/IconBox";
import "./index.css";

const CheckEmail = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const [email, setEmail] = useState();
	const [disabled, setDisabled] = useState(false);
	useEffect(() => {
		setEmail(sessionStorage.getItem("email"));
	}, []);

	// TODO - fix
	const openMail = () => {
		window.location.href = "mailto:";
	};

	const toastFail = [
		{
			body: t("auth.forgotPassword.toasts.emailNotFound"),
		},
		{
			body: t("auth.forgotPassword.toasts.redirect").replace("<seconds/>", "3"),
		},
		{
			body: t("auth.forgotPassword.toasts.redirect").replace("<seconds/>", "2"),
		},
		{
			body: t("auth.forgotPassword.toasts.redirect").replace("<seconds/>", "1"),
		},
	];

	const resendToken = async () => {
		setDisabled(true); // prevent resent button from being spammed
		if (!email) {
			let index = 0;
			const interval = setInterval(() => {
				if (index < toastFail.length) {
					createToast(toastFail[index]);
					index++;
				} else {
					clearInterval(interval);
					navigate("/forgot-password");
				}
			}, 1000);
		} else {
			const form = { email: email };
			const action = await dispatch(forgotPassword(form));
			if (action.payload.success) {
				createToast({
					body: t("auth.forgotPassword.toasts.sent").replace("<email/>", form.email),
				});
				setDisabled(false);
			} else {
				if (action.payload) {
					// dispatch errors
					createToast({
						body: action.payload.msg, // FIXME: Potential untranslated string
					});
				} else {
					// unknown errors
					createToast({
						body: t("common.toasts.unknownError"),
					});
				}
			}
		}
	};

	const handleNavigate = () => {
		sessionStorage.removeItem("email");
		navigate("/login");
	};

	return (
		<Stack
			className="check-email-page auth"
			overflow="hidden"
			sx={{
				"& h1": {
					color: theme.palette.primary.main,
					fontWeight: 600,
					fontSize: 22,
				},
				/* TODO font size from theme */
				"& p": { color: theme.palette.primary.contrastTextSecondary, fontSize: 13.5 },
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
				px={theme.spacing(12)}
				gap={theme.spacing(4)}
			>
				<Logo style={{ borderRadius: theme.shape.borderRadius }} />
				<Typography sx={{ userSelect: "none" }}>{t("common.appName")}</Typography>
			</Stack>
			<Stack
				width="100%"
				maxWidth={600}
				flex={1}
				justifyContent="center"
				px={{ xs: theme.spacing(12), lg: theme.spacing(20) }}
				pb={theme.spacing(20)}
				mx="auto"
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
				<Stack
					gap={{ xs: theme.spacing(8), sm: theme.spacing(10) }}
					alignItems="center"
					textAlign="center"
				>
					<Box>
						<Stack
							direction="row"
							justifyContent="center"
						>
							<IconBox
								height={48}
								width={48}
								minWidth={48}
								borderRadius={12}
								svgWidth={24}
								svgHeight={24}
								mb={theme.spacing(4)}
							>
								<EmailIcon alt={t("auth.forgotPassword.imageAlts.email")} />
							</IconBox>
						</Stack>
						<Typography component="h1">{t("auth.forgotPassword.heading")}</Typography>
						<Typography>
							<Trans
								i18nKey="auth.forgotPassword.subheadings.stepTwo"
								components={{
									email: (
										<Typography
											className="email-sent-to"
											component="span"
										>
											{email || "username@email.com"}
										</Typography>
									),
								}}
							/>
						</Typography>
					</Box>
					<Button
						variant="contained"
						color="accent"
						onClick={openMail}
						sx={{
							width: "100%",
							maxWidth: 400,
						}}
					>
						{t("auth.forgotPassword.buttons.openEmail")}
					</Button>
					<Typography sx={{ alignSelf: "center", mt: theme.spacing(6) }}>
						<Trans
							i18nKey="auth.forgotPassword.links.resend"
							components={{
								a: (
									<Typography
										component="span"
										onClick={resendToken}
										sx={{
											color: theme.palette.accent.main,
											userSelect: "none",
											pointerEvents: disabled ? "none" : "auto",
											cursor: disabled ? "default" : "pointer",
											opacity: disabled ? 0.5 : 1,
										}}
									/>
								),
							}}
						/>
					</Typography>
				</Stack>
			</Stack>
			<Box
				textAlign="center"
				p={theme.spacing(12)}
			>
				<Typography display="inline-block">
					<Trans
						i18nKey="auth.forgotPassword.links.login"
						components={{
							a: (
								<Typography
									component="span"
									color={theme.palette.accent.main}
									ml={theme.spacing(2)}
									onClick={handleNavigate}
									sx={{ userSelect: "none" }}
								/>
							),
						}}
					/>
				</Typography>
			</Box>
		</Stack>
	);
};

export default CheckEmail;

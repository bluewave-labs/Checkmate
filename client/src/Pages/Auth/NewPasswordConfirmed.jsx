import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearAuthState } from "../../Features/Auth/authSlice";
import Background from "../../assets/Images/background-grid.svg?react";
import ConfirmIcon from "../../assets/icons/check-outlined.svg?react";
import Logo from "../../assets/icons/checkmate-icon.svg?react";
import IconBox from "../../Components/IconBox";
import { Trans, useTranslation } from "react-i18next";
import "./index.css";

const NewPasswordConfirmed = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const handleNavigate = () => {
		dispatch(clearAuthState());
		navigate("/login");
	};

	return (
		<Stack
			className="password-confirmed-page auth"
			overflow="hidden"
			sx={{
				"& h1": {
					color: theme.palette.primary.main,
					fontWeight: 600,
					fontSize: 21,
				},
				/* TODO font size from theme*/
				"& p": { fontSize: 13.5, color: theme.palette.primary.contrastTextSecondary },
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
					gap={{ xs: theme.spacing(8), sm: theme.spacing(12) }}
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
								<ConfirmIcon alt={t("auth.forgotPassword.imageAlts.passwordConfirm")} />
							</IconBox>
						</Stack>
						<Typography component="h1">{t("auth.forgotPassword.heading")}</Typography>
						<Typography mb={theme.spacing(2)}>
							{t("auth.forgotPassword.subheadings.stepFour")}
						</Typography>
					</Box>
					<Button
						variant="contained"
						onClick={() => navigate("/uptime")}
						sx={{
							width: "100%",
							maxWidth: 400,
						}}
					>
						{t("auth.common.navigation.continue")}
					</Button>
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

export default NewPasswordConfirmed;

import React, { useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { networkService } from "../Utils/NetworkService";
import Alert from "../Components/Alert";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";
import Background from "../assets/Images/background-grid.svg?react";
import Logo from "../assets/icons/checkmate-icon.svg?react";
import ThemeSwitch from "../Components/ThemeSwitch";
import LanguageSelector from "../Components/LanguageSelector";

const ServerUnreachable = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { t } = useTranslation();

	// State for tracking connection check status
	const [isCheckingConnection, setIsCheckingConnection] = useState(false);

	const handleRetry = React.useCallback(async () => {
		setIsCheckingConnection(true);
		try {
			// Try to connect to the backend with a simple API call
			// We'll use any lightweight endpoint that doesn't require authentication
			await networkService.axiosInstance.get("/health", { timeout: 5000 });

			// If successful, show toast and navigate to login page
			createToast({
				body: t("errorPages.serverUnreachable.toasts.reconnected"),
			});
			navigate("/login");
		} catch (error) {
			// If still unreachable, stay on this page and show toast
			createToast({
				body: t("errorPages.serverUnreachable.toasts.stillUnreachable"),
			});
		} finally {
			setIsCheckingConnection(false);
		}
	}, [navigate, t]);

	return (
		<Stack
			className="login-page auth"
			overflow="hidden"
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

			{/* Header with logo */}
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
					<Typography sx={{ userSelect: "none" }}>{t("common.appName")}</Typography>
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
				<Stack
					spacing={theme.spacing(6)}
					alignItems="center"
				>
					<Box
						sx={{
							width: theme.spacing(220),
							mx: "auto",
							"& .alert.row-stack": {
								width: "100%",
								alignItems: "center",
								gap: theme.spacing(3),
							},
						}}
					>
						<Alert
							variant="error"
							body={t("errorPages.serverUnreachable.alertBox")}
							hasIcon={true}
						/>
					</Box>
					<Box mt={theme.spacing(2)}>
						<Typography
							variant="body1"
							align="center"
							color={theme.palette.primary.contrastTextSecondary}
						>
							{t("errorPages.serverUnreachable.description")}
						</Typography>
					</Box>
					<Box sx={{ mt: theme.spacing(4) }}>
						<Button
							variant="contained"
							color="accent"
							onClick={handleRetry}
							disabled={isCheckingConnection}
							className="dashboard-style-button"
							sx={{
								px: theme.spacing(6),
								borderRadius: `${theme.shape.borderRadius}px !important`,
								"&.MuiButtonBase-root": {
									borderRadius: `${theme.shape.borderRadius}px !important`,
								},
								"&.MuiButton-root": {
									borderRadius: `${theme.shape.borderRadius}px !important`,
								},
							}}
						>
							{isCheckingConnection
								? t("errorPages.serverUnreachable.retryButton.processing")
								: t("errorPages.serverUnreachable.retryButton.default")}
						</Button>
					</Box>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default ServerUnreachable;

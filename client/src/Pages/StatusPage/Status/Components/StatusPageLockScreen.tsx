import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { AxiosError } from "axios";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { TextField, Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { post } from "@/Utils/ApiClient";
import type { StatusPageTheme, StatusPageThemeMode } from "@/Types/StatusPage";

const CARD_MAX_WIDTH = 420;
const LOGO_MAX_HEIGHT = 48;

export interface LockScreenBranding {
	companyName: string;
	logo: { data: string; contentType: string } | null;
	color: string;
	theme: StatusPageTheme;
	themeMode: StatusPageThemeMode;
}

interface Props {
	url: string;
	branding: LockScreenBranding;
	onUnlocked: () => void;
}

export const StatusPageLockScreen = ({ url, branding, onUnlocked }: Props) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [errorKey, setErrorKey] = useState<null | "incorrect" | "rateLimited">(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setErrorKey(null);
		try {
			await post(`/status-page/${encodeURIComponent(url)}/unlock`, { password });
			onUnlocked();
		} catch (error) {
			const status = error instanceof AxiosError ? error.response?.status : undefined;
			setErrorKey(status === 429 ? "rateLimited" : "incorrect");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Stack
			minHeight="100vh"
			alignItems="center"
			justifyContent="center"
			bgcolor={theme.palette.background.default}
			p={LAYOUT.XXL}
		>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				alignItems="center"
				maxWidth={CARD_MAX_WIDTH}
				width="100%"
			>
				{branding.logo && (
					<Box
						component="img"
						src={`data:${branding.logo.contentType};base64,${branding.logo.data}`}
						alt={branding.companyName}
						maxHeight={LOGO_MAX_HEIGHT}
					/>
				)}
				<Typography
					variant="h1"
					fontSize={typographyLevels.xl}
					color={theme.palette.text.primary}
				>
					{branding.companyName}
				</Typography>
				<Typography
					color={theme.palette.text.secondary}
					textAlign="center"
				>
					{t("pages.statusPages.lock.title")}
				</Typography>

				<Box
					component="form"
					onSubmit={handleSubmit}
					width="100%"
				>
					<Stack gap={theme.spacing(LAYOUT.MD)}>
						<TextField
							type="password"
							fieldLabel={t("pages.statusPages.lock.passwordLabel")}
							value={password}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setPassword(e.target.value)
							}
							autoFocus
							fullWidth
						/>
						{errorKey && (
							<Typography
								color={theme.palette.error.main}
								fontSize={typographyLevels.s}
							>
								{t(`pages.statusPages.lock.${errorKey}`)}
							</Typography>
						)}
						<Button
							type="submit"
							variant="contained"
							disabled={submitting || !password}
						>
							{t("pages.statusPages.lock.submit")}
						</Button>
					</Stack>
				</Box>
			</Stack>
		</Stack>
	);
};

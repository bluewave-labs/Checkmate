import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";

interface OfflineBannerProps {
	visible: boolean;
	onRetry?: () => void;
	isRetrying?: boolean;
}

export const OfflineBanner = ({ visible, onRetry, isRetrying }: OfflineBannerProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!visible) {
		return null;
	}

	return (
		<Box
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: theme.zIndex.snackbar,
				backgroundColor: theme.palette.error.main,
				color: theme.palette.error.contrastText,
				px: theme.spacing(8),
				py: theme.spacing(4),
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="center"
				gap={theme.spacing(4)}
			>
				<WifiOff size={20} />
				<Typography
					variant="body2"
					fontWeight={500}
				>
					{t("components.offlineBanner.serverUnreachable")}
				</Typography>
				{onRetry && (
					<Button
						size="small"
						variant="outlined"
						onClick={onRetry}
						disabled={isRetrying}
						sx={{
							color: "inherit",
							borderColor: "currentColor",
							minWidth: "auto",
							py: 0.5,
							px: 2,
							"&:hover": {
								borderColor: "currentColor",
								backgroundColor: "rgba(255, 255, 255, 0.1)",
							},
						}}
					>
						{isRetrying
							? t("components.offlineBanner.retrying")
							: t("components.offlineBanner.retry")}
					</Button>
				)}
			</Stack>
		</Box>
	);
};

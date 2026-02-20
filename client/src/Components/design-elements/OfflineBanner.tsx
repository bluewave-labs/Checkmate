import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface OfflineBannerProps {
	visible: boolean;
}

export const OfflineBanner = ({ visible }: OfflineBannerProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [shouldRender, setShouldRender] = useState(visible);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (visible) {
			setShouldRender(true);
			requestAnimationFrame(() => setIsAnimating(true));
		} else {
			setIsAnimating(false);
			const timer = setTimeout(() => setShouldRender(false), 1000);
			return () => clearTimeout(timer);
		}
	}, [visible]);

	if (!shouldRender) return null;

	return (
		<Box
			sx={{
				position: "fixed",
				top: isAnimating ? 0 : "-100%",
				left: 0,
				right: 0,
				zIndex: theme.zIndex.snackbar,
				backgroundColor: theme.palette.error.main,
				color: theme.palette.error.contrastText,
				px: theme.spacing(8),
				py: theme.spacing(4),
				transition: "top 1s ease-in-out",
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
			</Stack>
		</Box>
	);
};

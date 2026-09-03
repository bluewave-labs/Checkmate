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
				// `error.dark` rather than `main`: in dark mode `main` is light
				// enough that MUI derives near-black contrastText, which reads as
				// a warning rather than an outage on the one surface where
				// urgency matters. `dark` keeps a solid red bar with white text
				// in both modes, and leaves `main` alone for the ~30 places that
				// use it as text or a chart mark on a dark ground.
				backgroundColor: theme.palette.error.dark,
				color: "#FFFFFF",
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

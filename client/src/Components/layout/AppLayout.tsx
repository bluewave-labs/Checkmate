import Box from "@mui/material/Box";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import BackgroundSVG from "@/assets/Images/background.svg";
import type { RootState } from "@/Types/state";
import { OfflineBanner } from "@/Components/design-elements";
import { setServerUnreachableCallback, get } from "@/Utils/ApiClient";

interface AppLayoutProps {
	children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	const theme = useTheme();
	const mode = useSelector((state: RootState) => state.ui.mode);
	const [serverUnreachable, setServerUnreachable] = useState(false);
	const retryIntervalRef = useRef<number | null>(null);

	useEffect(() => {
		setServerUnreachableCallback(setServerUnreachable);
	}, []);

	useEffect(() => {
		if (serverUnreachable) {
			retryIntervalRef.current = window.setInterval(async () => {
				try {
					await get("/health", { timeout: 5000 });
				} catch {
					// NO_OP
				}
			}, 5000);
		} else if (retryIntervalRef.current) {
			clearInterval(retryIntervalRef.current);
			retryIntervalRef.current = null;
		}

		return () => {
			if (retryIntervalRef.current) {
				clearInterval(retryIntervalRef.current);
			}
		};
	}, [serverUnreachable]);

	return (
		<Box
			sx={{
				minHeight: "100vh",
				backgroundColor: theme.palette.background.default,
				backgroundImage: mode === "dark" ? `url("${BackgroundSVG}")` : "none",
				backgroundSize: "100% 100%",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			<OfflineBanner visible={serverUnreachable} />
			{children}
		</Box>
	);
};

export default AppLayout;

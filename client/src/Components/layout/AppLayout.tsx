import Box from "@mui/material/Box";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { OfflineBanner, EgressBanner } from "@/Components/design-elements";
import { setServerUnreachableCallback, get } from "@/Utils/ApiClient";
import { useGet } from "@/Hooks/UseApi";
import type { RootState } from "@/Types/state";
import type { EgressState } from "@/Types/Egress";

const EGRESS_POLL_MS = 30_000;

interface AppLayoutProps {
	children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	const theme = useTheme();
	const [serverUnreachable, setServerUnreachable] = useState(false);
	const retryIntervalRef = useRef<number | null>(null);
	const authToken = useSelector((state: RootState) => state.auth.authToken);

	// Poll egress state only for signed-in users; failures are swallowed because
	// an unreachable server is already reported by OfflineBanner.
	const { data: egressState } = useGet<EgressState>(
		authToken ? "/egress" : null,
		undefined,
		{ refreshInterval: EGRESS_POLL_MS, shouldRetryOnError: false }
	);

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
			}}
		>
			<OfflineBanner visible={serverUnreachable} />
			{!serverUnreachable && <EgressBanner state={egressState} />}
			{children}
		</Box>
	);
};

export default AppLayout;

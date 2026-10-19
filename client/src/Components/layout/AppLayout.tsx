import Box from "@mui/material/Box";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { OfflineBanner, EgressBanner } from "@/Components/design-elements";
import { setServerUnreachableCallback, get } from "@/Utils/ApiClient";
import { useGet } from "@/Hooks/UseApi";
import type { ApiResponse } from "@/Hooks/UseApi";
import type { RootState } from "@/Types/state";
import type { EgressSummary } from "@/Types/Egress";

const EGRESS_POLL_MS = 30_000;
// While the self-check is off, poll rarely so tabs still notice when an admin switches it on.
const EGRESS_DISABLED_POLL_MS = 5 * 60_000;

interface AppLayoutProps {
	children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	const theme = useTheme();
	const [serverUnreachable, setServerUnreachable] = useState(false);
	const retryIntervalRef = useRef<number | null>(null);
	const authToken = useSelector((state: RootState) => state.auth.authToken);

	// Poll egress state only for signed-in users, and slowly while the self-check is off (focus
	// revalidation is off app-wide, so this poll is how other tabs see it switched on). A failed
	// poll hides the banner rather than leaving the last answer up; an unreachable server is
	// already reported by OfflineBanner.
	const { data: egressSummary, error: egressError } = useGet<EgressSummary>(
		authToken ? "/egress" : null,
		undefined,
		{
			refreshInterval: (latest?: ApiResponse<EgressSummary>) =>
				latest?.data.enabled === false ? EGRESS_DISABLED_POLL_MS : EGRESS_POLL_MS,
			shouldRetryOnError: false,
		}
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
			{!serverUnreachable && !egressError && <EgressBanner state={egressSummary} />}
			{children}
		</Box>
	);
};

export default AppLayout;

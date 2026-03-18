import { BasePage, BaseFallback } from "@/Components/design-elements";
import { StatusBar } from "@/Pages/StatusPage/Status/Components/StatusBar";
import { MonitorsList } from "@/Pages/StatusPage/Status/Components/MonitorsList";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import { useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useLocation, useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { StatusPageResponse } from "@/Types/StatusPage";
import { HeaderStatusPageControls } from "./Components/HeaderStatusPageControls";

const StatusPageView = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { url } = useParams();
	const isAdmin = useIsAdmin();
	const location = useLocation();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isPublic = location.pathname.startsWith("/status/public");

	const apiUrl = url ? `/status-page/${url}?type=uptime&type=infrastructure` : null;

	const { data, isLoading, error } = useGet<StatusPageResponse>(apiUrl);

	const statusPage = data?.statusPage;
	const monitors = data?.monitors ?? [];

	if (!statusPage) return null;

	if (monitors.length === 0) {
		return (
			<BasePage
				loading={isLoading}
				error={error}
				breadcrumbOverride={isPublic ? [] : undefined}
			>
				<Stack alignItems={"center"}>
					<BaseFallback>
						<Typography
							variant="h1"
							marginY={theme.spacing(4)}
							color={theme.palette.text.secondary}
						>
							{t("pages.statusPages.details.empty.title")}
						</Typography>
						{isAdmin && (
							<Link to={`/status/configure/${url}`}>
								{t("pages.statusPages.details.empty.addMonitor")}
							</Link>
						)}
					</BaseFallback>
				</Stack>
			</BasePage>
		);
	}

	let sx: React.CSSProperties = {};
	if (isPublic) {
		sx.paddingTop = theme.spacing(20);
		sx.paddingLeft = isSmall ? "5vw" : "20vw";
		sx.paddingRight = isSmall ? "5vw" : "20vw";
	}

	const logoSrc = statusPage.logo?.data
		? `data:${statusPage.logo.contentType};base64,${statusPage.logo.data}`
		: null;

	return (
		<BasePage
			loading={isLoading}
			error={error}
			sx={sx}
			breadcrumbOverride={isPublic ? [] : undefined}
		>
			<HeaderStatusPageControls
				isAdmin={isAdmin}
				statusPage={statusPage}
				isPublic={isPublic}
			/>
			{logoSrc && (
				<Box
					component="img"
					src={logoSrc}
					alignSelf={"flex-start"}
					alt={statusPage.companyName}
					sx={{
						maxHeight: 120,
						maxWidth: "100%",
						objectFit: "contain",
						mb: 2,
					}}
				/>
			)}
			<StatusBar monitors={monitors} />
			<MonitorsList
				statusPage={statusPage}
				monitors={monitors}
			/>
		</BasePage>
	);
};

export default StatusPageView;

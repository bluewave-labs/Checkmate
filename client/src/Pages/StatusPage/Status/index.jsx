// Components
import { Typography, Stack } from "@mui/material";
import GenericFallback from "../../../Components/GenericFallback";
import AdminLink from "./Components/AdminLink";
import ControlsHeader from "./Components/ControlsHeader";
import SkeletonLayout from "./Components/Skeleton";
import StatusBar from "./Components/StatusBar";
import MonitorsList from "./Components/MonitorsList";
import Breadcrumbs from "../../../Components/Breadcrumbs/index.jsx";
import TextLink from "../../../Components/TextLink";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";

// Utils
import { useStatusPageFetch } from "./Hooks/useStatusPageFetch";
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const PublicStatus = () => {
	const { url } = useParams();

	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const location = useLocation();
	const isAdmin = useIsAdmin();
	
	// State for response time chart date range
	const [dateRange, setDateRange] = useState("recent");

	const [statusPage, monitors, isLoading, networkError] = useStatusPageFetch(false, url);

	// Breadcrumbs
	const crumbs = [
		{ name: t("statusBreadCrumbsStatusPages"), path: "/status" },
		{ name: t("statusBreadCrumbsDetails"), path: `/status/uptime/${statusPage?.url}` },
	];

	// Setup
	let sx = { paddingLeft: theme.spacing(20), paddingRight: theme.spacing(20) };
	let link = undefined;
	const isPublic = location.pathname.startsWith("/status/uptime/public");
	// Public status page
	if (isPublic && statusPage && statusPage.showAdminLoginLink === true) {
		sx = {
			paddingTop: theme.spacing(20),
			paddingLeft: "20vw",
			paddingRight: "20vw",
		};
		link = <AdminLink />;
	}

	// Loading
	if (isLoading) {
		return <SkeletonLayout />;
	}

	if (monitors?.length === 0) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{"Theres nothing here yet"}
				</Typography>
				{isAdmin && (
					<TextLink
						linkText={"Add a monitor to get started"}
						href={`/status/uptime/configure/${url}`}
					/>
				)}
			</GenericFallback>
		);
	}

	// Error fetching data
	if (networkError === true) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("common.toasts.networkError")}
				</Typography>
				<Typography>{t("common.toasts.checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	// Public status page fallback
	if (!isLoading && typeof statusPage === "undefined" && isPublic) {
		return (
			<Stack sx={sx}>
				<GenericFallback>
					<Typography
						variant="h1"
						marginY={theme.spacing(4)}
						color={theme.palette.primary.contrastTextTertiary}
					>
						{t("statusPageStatus")}
					</Typography>
					<Typography>{t("statusPageStatusContactAdmin")}</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	// Finished loading, but status page is not public
	if (!isLoading && isPublic && statusPage.isPublished === false) {
		return (
			<Stack sx={sx}>
				<GenericFallback>
					<Typography
						variant="h1"
						marginY={theme.spacing(4)}
						color={theme.palette.primary.contrastTextTertiary}
					>
						{t("statusPageStatusNotPublic")}
					</Typography>
					<Typography>{t("statusPageStatusContactAdmin")}</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	// Status page doesn't exist
	if (!isLoading && typeof statusPage === "undefined") {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("statusPageStatusNoPage")}
				</Typography>
				<Typography>{t("statusPageStatusContactAdmin")}</Typography>
			</GenericFallback>
		);
	}

	return (
		<Stack
			gap={theme.spacing(10)}
			sx={{ ...sx, position: "relative" }}
		>
			{!isPublic && <Breadcrumbs list={crumbs} />}
			<ControlsHeader
				statusPage={statusPage}
				url={url}
				isPublic={isPublic}
			/>
			<Typography variant="h2">{t("statusPageStatusServiceStatus")}</Typography>
			<StatusBar monitors={monitors} />
			{statusPage?.showResponseTimeChart && (
				<MonitorTimeFrameHeader
					isLoading={isLoading}
					hasDateRange={true}
					dateRange={dateRange}
					setDateRange={setDateRange}
				/>
			)}
			<MonitorsList
				monitors={monitors}
				statusPage={statusPage}
				dateRange={dateRange}
			/>
			{link}
		</Stack>
	);
};

export default PublicStatus;

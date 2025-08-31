// Components
import { Typography, Stack } from "@mui/material";
import GenericFallback from "../../../Components/GenericFallback";
import AdminLink from "./Components/AdminLink";
import ControlsHeader from "./Components/ControlsHeader";
import SkeletonLayout from "./Components/Skeleton";
import StatusBar from "./Components/StatusBar";
import MonitorsList from "./Components/MonitorsList";
import MaintenanceBanner from "./Components/MaintenanceBanner";
import Breadcrumbs from "../../../Components/Breadcrumbs/index.jsx";
import TextLink from "../../../Components/TextLink";

// Utils
import { useStatusPageFetch } from "./Hooks/useStatusPageFetch";
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PublicStatus = () => {
	const { url } = useParams();

	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const location = useLocation();
	const isAdmin = useIsAdmin();

	const [statusPage, monitors, isLoading, networkError] = useStatusPageFetch(false, url);

	// Breadcrumbs
	const crumbs = [
		{ name: t("statusBreadCrumbsStatusPages"), path: "/status" },
		{ name: t("statusBreadCrumbsDetails"), path: `/status/uptime/${statusPage?.url}` },
	];

	// Setup - Use consistent 800px width for both dashboard and public views
	let sx = { 
		maxWidth: 800,
		margin: '0 auto',
		paddingLeft: theme.spacing(20), 
		paddingRight: theme.spacing(20),
		width: '100%'
	};
	let link = undefined;
	const isPublic = location.pathname.startsWith("/status/uptime/public");
	// Public status page
	if (isPublic && statusPage && statusPage.showAdminLoginLink === true) {
		sx = {
			maxWidth: 800,
			margin: '0 auto',
			paddingTop: theme.spacing(20),
			paddingLeft: theme.spacing(20),
			paddingRight: theme.spacing(20),
			width: '100%'
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

	// Filter monitors that are in maintenance
	const monitorsInMaintenance = monitors?.filter(monitor => monitor.isMaintenance) || [];

	return (
		<>
			{!isPublic && <Breadcrumbs list={crumbs} />}
			<Stack
				gap={theme.spacing(10)}
				sx={{ ...sx, position: "relative" }}
			>
				<ControlsHeader
					statusPage={statusPage}
					url={url}
					isPublic={isPublic}
				/>
				<MaintenanceBanner affectedMonitors={monitorsInMaintenance} />
				<Typography variant="h2">{t("statusPageStatusServiceStatus")}</Typography>
				<StatusBar monitors={monitors} />
				<MonitorsList monitors={monitors} />
				{link}
			</Stack>
		</>
	);
};

export default PublicStatus;

// Components
import { Typography, Stack } from "@mui/material";
import GenericFallback from "../../../Components/GenericFallback";
import AdminLink from "./Components/AdminLink";
import ControlsHeader from "./Components/ControlsHeader";
import SkeletonLayout from "./Components/Skeleton";
import StatusBar from "./Components/StatusBar";
import MonitorsList from "./Components/MonitorsList";
import Dialog from "../../../Components/Dialog";
import Breadcrumbs from "../../../Components/Breadcrumbs/index.jsx";

// Utils
import { useStatusPageFetch } from "./Hooks/useStatusPageFetch";
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useLocation } from "react-router-dom";
import { useStatusPageDelete } from "./Hooks/useStatusPageDelete";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const PublicStatus = () => {
	const { url } = useParams();

	// Local state
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();

	const [statusPage, monitors, isLoading, networkError, fetchStatusPage] =
		useStatusPageFetch(false, url);
	const [deleteStatusPage, isDeleting] = useStatusPageDelete(fetchStatusPage, url);
	
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
	if (isPublic) {
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

	// Error fetching data
	if (networkError === true) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("networkError")}
				</Typography>
				<Typography>{t("checkConnection")}</Typography>
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
				isDeleting={isDeleting}
				isDeleteOpen={isDeleteOpen}
				setIsDeleteOpen={setIsDeleteOpen}
				url={url}
				isPublic={isPublic}
			/>
			<Typography variant="h2">{t("statusPageStatusServiceStatus")}</Typography>
			<StatusBar monitors={monitors} />
			<MonitorsList monitors={monitors} />
			{link}
			<Dialog
				title={t("deleteStatusPage")}
				onConfirm={() => {
					deleteStatusPage();
					setIsDeleteOpen(false);
					navigate("/status");
				}}
				onCancel={() => {
					setIsDeleteOpen(false);
				}}
				open={isDeleteOpen}
				confirmationButtonLabel={t("deleteStatusPageConfirm")}
				description={t("deleteStatusPageDescription")}
				isLoading={isDeleting || isLoading}
			/>
		</Stack>
	);
};

export default PublicStatus;

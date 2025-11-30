// Components
import { Typography, Stack } from "@mui/material";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import AdminLink from "./Components/AdminLink/index.jsx";
import ControlsHeader from "./Components/ControlsHeader/index.jsx";
import SkeletonLayout from "./Components/Skeleton/index.jsx";
import StatusBar from "./Components/StatusBar/index.jsx";
import MonitorsList from "./Components/MonitorsList/index.jsx";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import TextLink from "@/Components/v1/TextLink/index.jsx";

// Utils
import { useStatusPageFetch } from "./Hooks/useStatusPageFetch.jsx";
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../../Hooks/v1/useIsAdmin.js";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
// --- CHANGE 1: Import useEffect ---
import { useEffect } from "react";

const PublicStatus = () => {
	const { url } = useParams();

	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const location = useLocation();
	const isAdmin = useIsAdmin();

	const [statusPage, monitors, isLoading, networkError] = useStatusPageFetch(false, url);

	// --- CHANGE 2: Inject Custom CSS and JS ---
	useEffect(() => {
        if (!statusPage) return;

        // --- 1. Inject Custom CSS ---
        let styleElement = null;
        if (statusPage.customCSS) {
            styleElement = document.createElement("style");
            styleElement.id = "custom-status-css";
            styleElement.innerHTML = statusPage.customCSS;
            document.head.appendChild(styleElement);
        }

        // --- 2. Inject Custom JS ---
        let scriptElement = null;
        if (statusPage.customJavaScript) {
            try {
                scriptElement = document.createElement("script");
                scriptElement.id = "custom-status-js";
                
                // Wrap in IIFE (Immediately Invoked Function Expression) with internal try/catch
                // This ensures that if the user writes bad JS, it errors to console but doesn't crash the UI
                scriptElement.textContent = `
                    (function() { 
                        try { 
                            ${statusPage.customJavaScript} 
                        } catch(e) { 
                            console.error('Custom Status Page Script Error:', e); 
                        } 
                    })();
                `;
                
                document.body.appendChild(scriptElement);
            } catch (e) {
                console.error("Failed to inject custom JS element:", e);
            }
        }

        // --- 3. Safe Cleanup ---
        return () => {
            // Clean up CSS using the direct reference
            if (styleElement && document.head.contains(styleElement)) {
                document.head.removeChild(styleElement);
            }

            // Clean up JS using the direct reference
            if (scriptElement && document.body.contains(scriptElement)) {
                document.body.removeChild(scriptElement);
            }
        };
    }, [statusPage]);
	// ------------------------------------------

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

			{/* --- CHANGE 3: Custom Header Logic --- */}
			{statusPage?.headerHTML ? (
				<div dangerouslySetInnerHTML={{ __html: statusPage.headerHTML }} />
			) : (
				<ControlsHeader
					statusPage={statusPage}
					url={url}
					isPublic={isPublic}
				/>
			)}
			{/* ------------------------------------- */}

			<Typography variant="h2">{t("statusPageStatusServiceStatus")}</Typography>
			<StatusBar monitors={monitors} />
			<MonitorsList
				monitors={monitors}
				statusPage={statusPage}
			/>

			{link}

			{/* --- CHANGE 4: Custom Footer Logic --- */}
			{statusPage?.footerHTML && (
				<div dangerouslySetInnerHTML={{ __html: statusPage.footerHTML }} />
			)}
			{/* ------------------------------------- */}
		</Stack>
	);
};

export default PublicStatus;

import { BasePage, BaseFallback } from "@/Components/design-elements";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useLocation, useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import { resolveStatusPageTheme } from "@/Types/StatusPage";
import {
	PUBLIC_STATUS_PAGE_PREFIX,
	type StatusPage,
	type StatusPageResponse,
	type StatusPageTheme,
} from "@/Types/StatusPage";
import { HeaderStatusPageControls } from "./Components/HeaderStatusPageControls";
import { StatusPageThemeProvider } from "./themes/StatusPageThemeProvider";
import { RefinedStatusPage } from "./themes/refined/RefinedStatusPage";
import { ModernStatusPage } from "./themes/modern/ModernStatusPage";
import { BoldStatusPage } from "./themes/bold/BoldStatusPage";
import { EditorialStatusPage } from "./themes/editorial/EditorialStatusPage";
import { BrowserFrame } from "./themes/BrowserFrame";

type ThemedRendererProps = {
	statusPage: StatusPage;
	monitors: (Monitor & { checks?: Monitor["recentChecks"] })[];
};

const THEMED_RENDERERS: Record<
	StatusPageTheme,
	React.ComponentType<ThemedRendererProps>
> = {
	refined: RefinedStatusPage,
	modern: ModernStatusPage,
	bold: BoldStatusPage,
	editorial: EditorialStatusPage,
};

const StatusPageView = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { url } = useParams();
	const isAdmin = useIsAdmin();
	const location = useLocation();

	const isPublic = location.pathname.startsWith(PUBLIC_STATUS_PAGE_PREFIX);

	const apiUrl = url ? `/status-page/${url}?type=uptime&type=infrastructure` : null;

	const { data, isLoading, error } = useGet<StatusPageResponse>(
		apiUrl,
		{},
		{
			refreshInterval: 10000,
		}
	);

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

	const ThemedRenderer = THEMED_RENDERERS[resolveStatusPageTheme(statusPage.theme)];
	const themedRenderer = (
		<ThemedRenderer
			statusPage={statusPage}
			monitors={monitors}
		/>
	);

	// Public route: render directly on the viewport, themed background covers everything.
	if (isPublic) {
		return (
			<StatusPageThemeProvider
				theme={statusPage.theme}
				themeMode={statusPage.themeMode}
				paintBody
			>
				{themedRenderer}
			</StatusPageThemeProvider>
		);
	}

	const publicUrl = `${window.location.origin}${PUBLIC_STATUS_PAGE_PREFIX}/${statusPage.url}`;
	return (
		<BasePage
			loading={isLoading}
			error={error}
			breadcrumbOverride={undefined}
			sx={{ flex: 1, minHeight: 0 }}
		>
			<HeaderStatusPageControls
				isAdmin={isAdmin}
				statusPage={statusPage}
				isPublic={false}
			/>
			<StatusPageThemeProvider
				theme={statusPage.theme}
				themeMode={statusPage.themeMode}
				transparent
			>
				<BrowserFrame url={publicUrl}>{themedRenderer}</BrowserFrame>
			</StatusPageThemeProvider>
		</BasePage>
	);
};

export default StatusPageView;

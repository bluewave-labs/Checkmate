import { BasePage, BaseFallback } from "@/Components/design-elements";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useLocation, useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import { resolveStatusPageTheme } from "@/Types/StatusPage";
import {
	PUBLIC_STATUS_PAGE_PREFIX,
	type StatusPageResponse,
	type StatusPageTheme,
} from "@/Types/StatusPage";
import { HeaderStatusPageControls } from "@/Pages/StatusPage/Status/Components/HeaderStatusPageControls";
import { StatusPageThemeProvider } from "@/Pages/StatusPage/Status/themes/StatusPageThemeProvider";
import {
	BaseStatusPage,
	type ThemeConfig,
} from "@/Pages/StatusPage/Status/themes/shared/BaseStatusPage";
import { BrowserFrame } from "@/Pages/StatusPage/Status/themes/BrowserFrame";
import { refinedStyles } from "@/Pages/StatusPage/Status/themes/refined/styles";
import { RefinedHeader } from "@/Pages/StatusPage/Status/themes/refined/RefinedHeader";
import { RefinedHero } from "@/Pages/StatusPage/Status/themes/refined/RefinedHero";
import { modernStyles } from "@/Pages/StatusPage/Status/themes/modern/styles";
import { ModernHeader } from "@/Pages/StatusPage/Status/themes/modern/ModernHeader";
import { ModernHero } from "@/Pages/StatusPage/Status/themes/modern/ModernHero";
import { boldStyles } from "@/Pages/StatusPage/Status/themes/bold/styles";
import { BoldHeader } from "@/Pages/StatusPage/Status/themes/bold/BoldHeader";
import { BoldHero } from "@/Pages/StatusPage/Status/themes/bold/BoldHero";
import { editorialStyles } from "@/Pages/StatusPage/Status/themes/editorial/styles";
import { EditorialHeader } from "@/Pages/StatusPage/Status/themes/editorial/EditorialHeader";
import { EditorialHero } from "@/Pages/StatusPage/Status/themes/editorial/EditorialHero";

const THEME_CONFIGS: Record<StatusPageTheme, ThemeConfig<any>> = {
	refined: {
		createStyles: refinedStyles,
		HeaderSlot: RefinedHeader,
		HeroSlot: RefinedHero,
	},
	modern: {
		createStyles: modernStyles,
		HeaderSlot: ModernHeader,
		HeroSlot: ModernHero,
		overallStatusOptions: { iconSize: 20 },
	},
	bold: {
		createStyles: boldStyles,
		HeaderSlot: BoldHeader,
		HeroSlot: BoldHero,
		overallStatusOptions: { iconSize: 18 },
	},
	editorial: {
		createStyles: editorialStyles,
		HeaderSlot: EditorialHeader,
		HeroSlot: EditorialHero,
		overallStatusOptions: { allUpKey: "pages.statusPages.editorial.allUp" },
	},
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

	const themeConfig = THEME_CONFIGS[resolveStatusPageTheme(statusPage.theme)];
	const themedRenderer = (
		<BaseStatusPage
			statusPage={statusPage}
			monitors={monitors}
			config={themeConfig}
		/>
	);

	// Public route: render directly on the viewport, themed background covers everything.
	if (isPublic) {
		return (
			<StatusPageThemeProvider
				theme={statusPage.theme}
				themeMode={statusPage.themeMode}
				timezone={statusPage.timezone}
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
				timezone={statusPage.timezone}
				transparent
			>
				<BrowserFrame url={publicUrl}>{themedRenderer}</BrowserFrame>
			</StatusPageThemeProvider>
		</BasePage>
	);
};

export default StatusPageView;

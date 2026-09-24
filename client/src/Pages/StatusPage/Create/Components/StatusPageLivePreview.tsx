import type { Monitor } from "@/Types/Monitor";
import {
	resolveStatusPageTheme,
	resolveStatusPageThemeMode,
	type StatusPage,
	type StatusPageTheme,
} from "@/Types/StatusPage";
import type { StatusPageFormData } from "@/Validation/statusPage";
import { useWatch, type UseFormReturn } from "react-hook-form";
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
import { minimalStyles } from "@/Pages/StatusPage/Status/themes/minimal/styles";

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
	minimal: {
		createStyles: minimalStyles,
		HeaderSlot: RefinedHeader,
		HeroSlot: RefinedHero,
	},
};

interface Props {
	form: UseFormReturn<StatusPageFormData>;
	monitors: Monitor[];
}

const logoForStatusPage = (
	logo: { data?: string; contentType?: string } | null | undefined
): StatusPage["logo"] => {
	if (!logo?.data || !logo.contentType) return null;
	return {
		contentType: logo.contentType,
		data: logo.data.split(",")[1] ?? logo.data,
	};
};

export const StatusPageLivePreview = ({ form, monitors }: Props) => {
	const values = useWatch({ control: form.control });

	const statusPage: StatusPage = {
		id: "preview",
		userId: "preview",
		teamId: "preview",
		type: values.type ?? ["uptime"],
		companyName: values.companyName ?? "",
		url: values.url ?? "preview",
		customDomain: values.customDomain,
		timezone: values.timezone,
		color: values.color ?? "#13715B",
		monitors: values.monitors ?? [],
		subMonitors: [],
		logo: logoForStatusPage(values.logo),
		isPublished: values.isPublished ?? false,
		showCharts: values.showCharts ?? true,
		showUptimePercentage: values.showUptimePercentage ?? true,
		showAdminLoginLink: values.showAdminLoginLink ?? false,
		showInfrastructure: values.showInfrastructure ?? false,
		customCSS: values.customCSS ?? "",
		theme: resolveStatusPageTheme(values.theme),
		themeMode: resolveStatusPageThemeMode(values.themeMode),
		createdAt: "",
		updatedAt: "",
	};
	const selectedMonitors = monitors.filter((monitor) =>
		statusPage.monitors.includes(monitor.id)
	);

	return (
		<StatusPageThemeProvider
			theme={statusPage.theme}
			themeMode={statusPage.themeMode}
			timezone={statusPage.timezone}
			brandColor={statusPage.color}
			transparent
		>
			<BrowserFrame url={statusPage.url}>
				<BaseStatusPage
					statusPage={statusPage}
					monitors={selectedMonitors}
					config={THEME_CONFIGS[statusPage.theme]}
					range="latest"
					onRangeChange={() => undefined}
					bucketTimezone={statusPage.timezone ?? "Etc/UTC"}
				/>
			</BrowserFrame>
		</StatusPageThemeProvider>
	);
};

// Source of truth for the Releases timeline. Newest first.
// Each entry should focus on user-facing features — leave routine
// bumps, lint fixes, and dependency updates out.

export interface Release {
	version: string;
	date: string; // ISO 8601 yyyy-mm-dd
	headline: string;
	highlights: string[];
}

export const releases: Release[] = [
	{
		version: "v3.7.1",
		date: "2026-04-29",
		headline: "Status page themes and a polished incidents page",
		highlights: [
			"Pick a theme for your public status page: Refined, Modern, Bold, or Editorial",
			"Choose between light, dark, or auto theme modes",
			"Polished incidents page with better filtering and grouping",
			"New empty state for the infrastructure network view",
			"Remove-monitors confirmation modal in settings",
		],
	},
	{
		version: "v3.6.1",
		date: "2026-04-23",
		headline: "Twilio SMS notifications and incident comments",
		highlights: [
			"Send incident alerts via SMS using Twilio",
			"Resolve incidents with a comment so context is preserved",
			"Login page no longer shows the register tip when registration is closed",
			"Removed TimescaleDB dependency for a leaner deployment",
			"New monitor-lifecycle documentation",
		],
	},
	{
		version: "v3.5.1",
		date: "2026-03-06",
		headline: "Uptime over WebSockets, Globalping ping, and team member removal",
		highlights: [
			"Real-time uptime updates over WebSockets — no more polling delays",
			"Use Globalping as the engine for distributed ping monitors",
			"Admins can remove team members from the team settings page",
			"Fixed dark-mode background and several theme contrast issues",
		],
	},
	{
		version: "v3.5.0",
		date: "2026-03-04",
		headline: "SWR data layer and tightened validation",
		highlights: [
			"Global SWR-based data fetching for snappier navigation and automatic revalidation",
			"Stricter server-side validation across all monitor types",
			"Env-var validation surfaces misconfiguration at startup, not at first failure",
			"Logs page improvements for easier debugging",
		],
	},
	{
		version: "v3.4.0",
		date: "2026-02-20",
		headline: "Settings refactor and status page access fixes",
		highlights: [
			"Settings UI rebuilt for clarity and consistency",
			"Fixed access rules so unpublished status pages remain admin-only",
			"Several caching fixes for fresher data after configuration changes",
		],
	},
	{
		version: "v3.3",
		date: "2026-01-27",
		headline: "PageSpeed v2 details and a faster uptime details page",
		highlights: [
			"Rebuilt PageSpeed details view with deeper Core Web Vitals breakdown",
			"v2 uptime details page with denser charts and faster loading",
			"Recent-checks endpoint redesigned for lower latency",
			"PageSpeed tooltips clarify what each metric means",
		],
	},
	{
		version: "v3.2.0",
		date: "2025-09-18",
		headline: "Notification bodies and uptime % charts",
		highlights: [
			"Customise the body of email, Slack, Discord, and webhook notifications",
			"Toggle between absolute uptime and uptime % on monitor charts",
			"Sliding-window threshold evaluation for more stable status decisions",
			"Skip-maintenance notifications no longer fire during maintenance windows",
		],
	},
	{
		version: "v3.1",
		date: "2025-08-20",
		headline: "N-of-M alert thresholds and PagerDuty",
		highlights: [
			"Alert only after N consecutive failures out of M checks — fewer flaky alerts",
			"PagerDuty notification channel",
			"Streamlined maintenance window creation flow",
			"Network service refactor for more reliable cross-region checks",
		],
	},
	{
		version: "v2.3",
		date: "2025-07-08",
		headline: "Resolvable incidents and a cleaner incidents UI",
		highlights: [
			"Mark incidents as resolved from the UI with a single click",
			"Redesigned incidents page with better grouping",
			"Move the status-page delete action out of harm's way",
			"Configurable behavior when no notifications are attached to a monitor",
		],
	},
	{
		version: "v2.2",
		date: "2025-07-07",
		headline: "Notification management and i18n polish",
		highlights: [
			"Delete notification channels with confirmation",
			"Sorted translation keys for easier maintenance",
			"Many small i18n fixes across pages",
		],
	},
	{
		version: "v2.1",
		date: "2025-05-13",
		headline: "Maintenance window improvements and form fixes",
		highlights: [
			"Settings update flow rebuilt",
			"Fixed monitor resume / pause behavior",
			"Better PageSpeed reliability",
			"Infrastructure monitor filtering improvements",
			"Conditional alert rendering during maintenance windows",
		],
	},
	{
		version: "v2.0",
		date: "2024-12-04",
		headline: "Major UI refresh and password security",
		highlights: [
			"Major frontend redesign with a refreshed theme",
			"Improved password validation and error messages",
			"Many fixes to incident detail views, colors, and responsiveness",
		],
	},
	{
		version: "v1.1.0",
		date: "2024-10-11",
		headline: "Maintenance windows and JWT-expiry handling",
		highlights: [
			"Schedule maintenance windows so checks don't fire false incidents",
			"Auto-logout users when their JWT expires",
			"Centralised backend error handling",
			"Initial maintenance-page feature",
		],
	},
	{
		version: "v1.0",
		date: "2024-09-23",
		headline: "First public release",
		highlights: [
			"HTTP, ping, port, and PageSpeed monitors",
			"Incident detection with email and Discord notifications",
			"Public status pages",
			"Team management with role-based access",
			"Open source under the AGPL — self-host the entire stack",
		],
	},
];

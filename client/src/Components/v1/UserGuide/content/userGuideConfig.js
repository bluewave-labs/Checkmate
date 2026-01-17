// Icon names as strings - resolved to actual components in UserGuideLanding.jsx
// Available icons: Rocket, Globe, Gauge, Server, Bell, AlertTriangle, Settings, Wifi, Wrench, Users

/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string[]} keywords
 */

/**
 * @typedef {Object} Collection
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} icon
 * @property {number} articleCount
 * @property {Article[]} articles
 */

/**
 * @typedef {Object} FastFind
 * @property {string} id
 * @property {string} title
 * @property {string} collectionId
 * @property {string} articleId
 */

// Collections configuration for Checkmate
export const collections = [
	{
		id: "getting-started",
		title: "Getting started",
		description: "Essential first steps for new users.",
		icon: "Rocket",
		articleCount: 4,
		articles: [
			{
				id: "what-is-checkmate",
				title: "What is Checkmate",
				description: "Overview of monitoring capabilities and core features.",
				keywords: ["introduction", "overview", "platform", "monitoring", "uptime"],
			},
			{
				id: "quick-start",
				title: "Quick start guide",
				description: "Create your first monitor in 5 minutes.",
				keywords: ["quick", "start", "first", "monitor", "setup", "tutorial"],
			},
			{
				id: "dashboard",
				title: "Understanding the dashboard",
				description: "Navigation and key metrics explained.",
				keywords: ["dashboard", "navigation", "interface", "home", "metrics"],
			},
			{
				id: "roles-permissions",
				title: "User roles and permissions",
				description: "User, Admin, and Superadmin roles explained.",
				keywords: ["role", "permission", "admin", "superadmin", "user", "access"],
			},
		],
	},
	{
		id: "uptime-monitoring",
		title: "Uptime monitoring",
		description: "Monitor website and service availability.",
		icon: "Globe",
		articleCount: 9,
		articles: [
			{
				id: "http-monitors",
				title: "Creating HTTP monitors",
				description: "URL monitoring with response validation.",
				keywords: ["http", "https", "url", "website", "monitor", "create"],
			},
			{
				id: "ping-monitors",
				title: "Ping monitors",
				description: "ICMP-based availability checks.",
				keywords: ["ping", "icmp", "availability", "monitor"],
			},
			{
				id: "port-monitors",
				title: "Port monitors",
				description: "TCP port availability monitoring.",
				keywords: ["port", "tcp", "availability", "monitor", "service"],
			},
			{
				id: "docker-monitors",
				title: "Docker monitors",
				description: "Monitor Docker container status and health.",
				keywords: ["docker", "container", "monitoring", "health", "status"],
			},
			{
				id: "bulk-import",
				title: "Bulk import monitors",
				description: "Import multiple monitors from a CSV file.",
				keywords: ["bulk", "import", "csv", "multiple", "batch", "upload"],
			},
			{
				id: "intervals-timing",
				title: "Monitor intervals and timing",
				description: "Configure how often to check your services.",
				keywords: ["interval", "timing", "frequency", "check", "schedule"],
			},
			{
				id: "json-path-matching",
				title: "JSON path matching",
				description: "Validate API response content.",
				keywords: ["json", "api", "response", "validation", "match", "path"],
			},
			{
				id: "ssl-tls-monitoring",
				title: "SSL/TLS monitoring",
				description: "Certificate tracking and error handling.",
				keywords: ["ssl", "tls", "certificate", "https", "security", "expiry"],
			},
			{
				id: "uptime-metrics",
				title: "Understanding uptime metrics",
				description: "Response time, status codes, and uptime percentage.",
				keywords: [
					"metrics",
					"response",
					"time",
					"status",
					"code",
					"uptime",
					"percentage",
				],
			},
		],
	},
	{
		id: "pagespeed",
		title: "PageSpeed monitoring",
		description: "Track website performance and Core Web Vitals.",
		icon: "Gauge",
		articleCount: 5,
		articles: [
			{
				id: "creating-pagespeed",
				title: "Creating PageSpeed monitors",
				description: "Setup and configuration for performance monitoring.",
				keywords: ["pagespeed", "create", "setup", "performance", "lighthouse"],
			},
			{
				id: "understanding-scores",
				title: "Understanding scores",
				description: "Performance, Accessibility, SEO, and Best Practices explained.",
				keywords: ["score", "performance", "accessibility", "seo", "best", "practices"],
			},
			{
				id: "core-web-vitals",
				title: "Core Web Vitals explained",
				description: "LCP, FCP, CLS, TBT, and Speed Index.",
				keywords: ["core", "web", "vitals", "lcp", "fcp", "cls", "tbt", "speed", "index"],
			},
			{
				id: "pagespeed-api",
				title: "PageSpeed API configuration",
				description: "Setting up your Google PageSpeed API key.",
				keywords: ["api", "key", "google", "pagespeed", "configure", "setup"],
			},
			{
				id: "performance-trends",
				title: "Performance trends",
				description: "Tracking improvements over time.",
				keywords: ["trend", "history", "improvement", "tracking", "chart"],
			},
		],
	},
	{
		id: "infrastructure",
		title: "Infrastructure monitoring",
		description: "Monitor server hardware with Capture agent.",
		icon: "Server",
		articleCount: 6,
		articles: [
			{
				id: "installing-capture",
				title: "Installing Capture agent",
				description: "Setup the monitoring agent on your servers.",
				keywords: ["install", "capture", "agent", "setup", "server"],
			},
			{
				id: "cpu-monitoring",
				title: "CPU monitoring",
				description: "Usage, temperature, and core metrics.",
				keywords: ["cpu", "processor", "usage", "temperature", "cores"],
			},
			{
				id: "memory-monitoring",
				title: "Memory monitoring",
				description: "RAM usage and availability tracking.",
				keywords: ["memory", "ram", "usage", "available", "free"],
			},
			{
				id: "disk-monitoring",
				title: "Disk monitoring",
				description: "Storage space and read/write speeds.",
				keywords: ["disk", "storage", "space", "read", "write", "speed"],
			},
			{
				id: "network-monitoring",
				title: "Network monitoring",
				description: "Bandwidth and packet statistics.",
				keywords: ["network", "bandwidth", "packet", "interface", "traffic"],
			},
			{
				id: "hardware-thresholds",
				title: "Setting hardware thresholds",
				description: "Alert when resources become critical.",
				keywords: ["threshold", "alert", "critical", "warning", "limit"],
			},
		],
	},
	{
		id: "incidents",
		title: "Incidents & alerts",
		description: "Respond to downtime and issues.",
		icon: "AlertTriangle",
		articleCount: 4,
		articles: [
			{
				id: "understanding-incidents",
				title: "Understanding incidents",
				description: "How incidents are detected and created.",
				keywords: ["incident", "detection", "downtime", "outage", "alert"],
			},
			{
				id: "incident-timeline",
				title: "Incident timeline",
				description: "Tracking start, duration, and resolution.",
				keywords: ["timeline", "duration", "start", "end", "resolution"],
			},
			{
				id: "resolving-incidents",
				title: "Resolving incidents",
				description: "Manual vs automatic resolution.",
				keywords: ["resolve", "manual", "automatic", "acknowledge", "fix"],
			},
			{
				id: "incident-history",
				title: "Incident history and analysis",
				description: "Learn from past outages.",
				keywords: ["history", "analysis", "report", "past", "outage"],
			},
		],
	},
	{
		id: "checks",
		title: "Checks",
		description: "View monitoring check results and history.",
		icon: "FileText",
		articleCount: 3,
		articles: [
			{
				id: "understanding-checks",
				title: "Understanding checks",
				description: "What checks are and how they work.",
				keywords: ["check", "result", "monitoring", "status", "response"],
			},
			{
				id: "check-details",
				title: "Check details and timing",
				description: "Response times, status codes, and timing breakdown.",
				keywords: ["response", "time", "timing", "breakdown", "dns", "tls"],
			},
			{
				id: "filtering-checks",
				title: "Filtering and date ranges",
				description: "Filter checks by date range and status.",
				keywords: ["filter", "date", "range", "pagination", "sort"],
			},
		],
	},
	{
		id: "logs",
		title: "Logs & diagnostics",
		description: "System logs, queue monitoring, and diagnostics.",
		icon: "Database",
		articleCount: 3,
		articles: [
			{
				id: "application-logs",
				title: "Application logs",
				description: "View and filter system logs by level.",
				keywords: ["log", "error", "warning", "info", "debug", "filter"],
			},
			{
				id: "queue-monitoring",
				title: "Queue monitoring",
				description: "Monitor background jobs and queue status.",
				keywords: ["queue", "job", "background", "bullmq", "worker"],
			},
			{
				id: "system-diagnostics",
				title: "System diagnostics",
				description: "CPU, memory, and heap usage metrics.",
				keywords: ["diagnostics", "cpu", "memory", "heap", "performance"],
			},
		],
	},
	{
		id: "notifications",
		title: "Notifications",
		description: "Get alerted when things go wrong.",
		icon: "Bell",
		articleCount: 7,
		articles: [
			{
				id: "email-notifications",
				title: "Email notifications",
				description: "SMTP setup and configuration.",
				keywords: ["email", "smtp", "mail", "setup", "configure"],
			},
			{
				id: "slack-integration",
				title: "Slack integration",
				description: "Webhook setup for Slack channels.",
				keywords: ["slack", "webhook", "integration", "channel"],
			},
			{
				id: "discord-integration",
				title: "Discord integration",
				description: "Channel notifications via webhooks.",
				keywords: ["discord", "webhook", "integration", "channel"],
			},
			{
				id: "pagerduty-integration",
				title: "PagerDuty integration",
				description: "On-call management integration.",
				keywords: ["pagerduty", "oncall", "integration", "escalation"],
			},
			{
				id: "webhook-notifications",
				title: "Webhook notifications",
				description: "Custom HTTP callbacks for alerts.",
				keywords: ["webhook", "http", "callback", "custom", "api"],
			},
			{
				id: "matrix-integration",
				title: "Matrix integration",
				description: "Decentralized messaging notifications.",
				keywords: ["matrix", "messaging", "integration", "homeserver"],
			},
			{
				id: "testing-notifications",
				title: "Testing notifications",
				description: "Verify your notification setup works.",
				keywords: ["test", "verify", "notification", "check"],
			},
		],
	},
	{
		id: "status-pages",
		title: "Status pages",
		description: "Share uptime with your users.",
		icon: "Wifi",
		articleCount: 5,
		articles: [
			{
				id: "creating-status-page",
				title: "Creating a status page",
				description: "Public-facing uptime dashboard setup.",
				keywords: ["status", "page", "create", "public", "dashboard"],
			},
			{
				id: "customizing-appearance",
				title: "Customizing appearance",
				description: "Logo, colors, and branding options.",
				keywords: ["customize", "logo", "color", "brand", "style"],
			},
			{
				id: "adding-monitors",
				title: "Adding monitors to status page",
				description: "Main monitors and sub-components.",
				keywords: ["add", "monitor", "component", "group"],
			},
			{
				id: "display-options",
				title: "Display options",
				description: "Charts, uptime percentage, and login links.",
				keywords: ["display", "chart", "uptime", "percentage", "option"],
			},
			{
				id: "sharing",
				title: "Sharing your status page",
				description: "Share your status page URL with users.",
				keywords: ["share", "url", "public", "link", "access"],
			},
		],
	},
	{
		id: "maintenance",
		title: "Maintenance windows",
		description: "Schedule planned downtime.",
		icon: "Wrench",
		articleCount: 3,
		articles: [
			{
				id: "creating-maintenance",
				title: "Creating maintenance windows",
				description: "Suppress alerts during planned maintenance.",
				keywords: ["maintenance", "create", "schedule", "suppress", "alert"],
			},
			{
				id: "recurring-maintenance",
				title: "One-time vs recurring",
				description: "Different scheduling options.",
				keywords: ["recurring", "one-time", "schedule", "repeat", "frequency"],
			},
			{
				id: "managing-maintenance",
				title: "Managing active maintenance",
				description: "Edit, extend, or cancel maintenance windows.",
				keywords: ["manage", "edit", "cancel", "extend", "active"],
			},
		],
	},
	{
		id: "team-management",
		title: "Team management",
		description: "Collaborate with your team.",
		icon: "Users",
		articleCount: 3,
		articles: [
			{
				id: "inviting-members",
				title: "Inviting team members",
				description: "Send email invitations to your team.",
				keywords: ["invite", "team", "member", "email", "add"],
			},
			{
				id: "user-roles",
				title: "User roles",
				description: "Admin vs User permissions explained.",
				keywords: ["role", "admin", "user", "permission", "access"],
			},
			{
				id: "managing-access",
				title: "Managing team access",
				description: "Add and remove team members.",
				keywords: ["manage", "access", "remove", "team", "member"],
			},
		],
	},
	{
		id: "settings",
		title: "Settings & configuration",
		description: "Customize your Checkmate instance.",
		icon: "Settings",
		articleCount: 6,
		articles: [
			{
				id: "account-settings",
				title: "Account settings",
				description: "Manage your profile, password, and account.",
				keywords: ["account", "profile", "password", "avatar", "photo", "delete"],
			},
			{
				id: "email-configuration",
				title: "Email configuration",
				description: "SMTP server setup for notifications.",
				keywords: ["email", "smtp", "configure", "server", "mail"],
			},
			{
				id: "global-thresholds",
				title: "Global thresholds",
				description: "Default alert levels for all monitors.",
				keywords: ["threshold", "global", "default", "alert", "level"],
			},
			{
				id: "appearance",
				title: "Appearance settings",
				description: "Theme and display preferences.",
				keywords: ["appearance", "theme", "dark", "light", "display", "mode"],
			},
			{
				id: "timezone-settings",
				title: "Timezone settings",
				description: "Display preferences for dates and times.",
				keywords: ["timezone", "time", "date", "display", "preference"],
			},
			{
				id: "export-monitors",
				title: "Export monitors",
				description: "Download your monitors as JSON.",
				keywords: ["export", "download", "backup", "json", "monitors"],
			},
		],
	},
];

// Fast Finds - Popular/quick access articles
export const fastFinds = [
	{
		id: "ff-1",
		title: "Creating your first monitor",
		collectionId: "getting-started",
		articleId: "quick-start",
	},
	{
		id: "ff-2",
		title: "Setting up email notifications",
		collectionId: "notifications",
		articleId: "email-notifications",
	},
	{
		id: "ff-3",
		title: "Installing Capture agent",
		collectionId: "infrastructure",
		articleId: "installing-capture",
	},
	{
		id: "ff-4",
		title: "Creating a status page",
		collectionId: "status-pages",
		articleId: "creating-status-page",
	},
	{
		id: "ff-5",
		title: "Understanding Core Web Vitals",
		collectionId: "pagespeed",
		articleId: "core-web-vitals",
	},
];

// Helper functions
export const getCollection = (collectionId) => {
	return collections.find((c) => c.id === collectionId);
};

export const getArticle = (collectionId, articleId) => {
	const collection = getCollection(collectionId);
	return collection?.articles.find((a) => a.id === articleId);
};

export const getTotalArticleCount = () => {
	return collections.reduce((sum, collection) => sum + collection.articleCount, 0);
};

/**
 * @typedef {Object} SearchResult
 * @property {string} collectionId
 * @property {string} collectionTitle
 * @property {string} articleId
 * @property {string} articleTitle
 * @property {string} articleDescription
 * @property {'title' | 'description' | 'keyword'} matchType
 */

/**
 * Search articles by query
 * @param {string} query
 * @returns {SearchResult[]}
 */
export const searchArticles = (query) => {
	if (!query || query.trim().length < 2) return [];

	const normalizedQuery = query.toLowerCase().trim();
	const results = [];

	for (const collection of collections) {
		for (const article of collection.articles) {
			let matchType = null;

			// Check title match (highest priority)
			if (article.title.toLowerCase().includes(normalizedQuery)) {
				matchType = "title";
			}
			// Check description match
			else if (article.description.toLowerCase().includes(normalizedQuery)) {
				matchType = "description";
			}
			// Check keywords match
			else if (
				article.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery))
			) {
				matchType = "keyword";
			}

			if (matchType) {
				results.push({
					collectionId: collection.id,
					collectionTitle: collection.title,
					articleId: article.id,
					articleTitle: article.title,
					articleDescription: article.description,
					matchType,
				});
			}
		}
	}

	// Sort by match type priority: title > description > keyword
	return results.sort((a, b) => {
		const priority = { title: 0, description: 1, keyword: 2 };
		return priority[a.matchType] - priority[b.matchType];
	});
};

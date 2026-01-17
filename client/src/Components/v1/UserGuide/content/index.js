// Article content - each article has its content defined here
// Import content as needed to keep bundle size manageable

const articleContents = {
	// ============================================
	// GETTING STARTED COLLECTION
	// ============================================

	"getting-started/what-is-checkmate": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Checkmate is an open-source uptime and infrastructure monitoring platform. It helps you track website availability, server performance, and service health—all from a single dashboard.",
			},
			{
				type: "paragraph",
				text: "Whether you're monitoring a personal project or managing enterprise infrastructure, Checkmate provides the tools you need to stay informed about your systems.",
			},
			{
				type: "heading",
				id: "core-features",
				level: 2,
				text: "Core features",
			},
			{
				type: "icon-cards",
				items: [
					{
						icon: "Globe",
						title: "Uptime monitoring",
						description:
							"Monitor websites and APIs with HTTP, ping, and TCP port checks.",
					},
					{
						icon: "Gauge",
						title: "PageSpeed insights",
						description:
							"Track website performance with Google Lighthouse integration.",
					},
					{
						icon: "Server",
						title: "Infrastructure monitoring",
						description: "Monitor CPU, memory, disk, and network with the Capture agent.",
					},
					{
						icon: "Bell",
						title: "Instant alerts",
						description: "Get notified via email, Slack, Discord, PagerDuty, or webhooks.",
					},
				],
			},
			{
				type: "heading",
				id: "monitoring-types",
				level: 2,
				text: "Monitoring types",
			},
			{
				type: "bullet-list",
				items: [
					{
						bold: "HTTP/HTTPS",
						text: "Check website availability and response validation",
					},
					{
						bold: "Ping",
						text: "Verify server reachability using ICMP",
					},
					{
						bold: "TCP port",
						text: "Monitor specific services like databases and mail servers",
					},
					{
						bold: "Docker",
						text: "Monitor Docker container status and health",
					},
					{
						bold: "PageSpeed",
						text: "Track Core Web Vitals and performance scores",
					},
					{
						bold: "Infrastructure",
						text: "Monitor hardware metrics with the Capture agent",
					},
				],
			},
			{
				type: "heading",
				id: "next-steps",
				level: 2,
				text: "Next steps",
			},
			{
				type: "article-links",
				items: [
					{
						collectionId: "getting-started",
						articleId: "quick-start",
						title: "Quick start guide",
						description: "Create your first monitor in 5 minutes",
					},
					{
						collectionId: "getting-started",
						articleId: "dashboard",
						title: "Understanding the dashboard",
						description: "Learn to navigate the interface",
					},
				],
			},
		],
	},

	"getting-started/quick-start": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "This guide walks you through creating your first monitor and setting up notifications. You'll have a working monitoring setup in about 5 minutes.",
			},
			{
				type: "heading",
				id: "create-monitor",
				level: 2,
				text: "Creating your first monitor",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Uptime** in the sidebar" },
					{ text: "Click **Create monitor** in the top right" },
					{ text: "Select **HTTP/HTTPS** as the monitor type" },
					{ text: "Enter the URL you want to monitor (e.g., `https://example.com`)" },
					{ text: "Set the check interval (1-5 minutes recommended for critical services)" },
					{ text: "Click **Create monitor** to start monitoring" },
				],
			},
			{
				type: "callout",
				variant: "tip",
				text: "Use descriptive names like \"Production API\" or \"Marketing Website\" to easily identify monitors in alerts.",
			},
			{
				type: "heading",
				id: "verify-monitor",
				level: 2,
				text: "Verifying your monitor",
			},
			{
				type: "paragraph",
				text: "After creating a monitor, Checkmate immediately performs the first check. You can verify it's working by:",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Click on your new monitor to open the details page" },
					{ text: "Check the status indicator shows **Up** (green)" },
					{ text: "View the response time in the metrics panel" },
				],
			},
			{
				type: "heading",
				id: "setup-notifications",
				level: 2,
				text: "Setting up notifications",
			},
			{
				type: "paragraph",
				text: "To receive alerts when your monitor goes down:",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Notifications** in the sidebar" },
					{ text: "Click **Create notification**" },
					{ text: "Select your preferred channel (email, Slack, Discord, etc.)" },
					{ text: "Configure the notification settings" },
					{ text: "Click **Test** to verify the notification works" },
				],
			},
			{
				type: "article-links",
				title: "Next steps",
				items: [
					{
						collectionId: "uptime-monitoring",
						articleId: "http-monitors",
						title: "Creating HTTP monitors",
						description: "Advanced configuration options",
					},
					{
						collectionId: "notifications",
						articleId: "email-notifications",
						title: "Email notifications",
						description: "Configure SMTP for email alerts",
					},
				],
			},
		],
	},

	"getting-started/dashboard": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "The Checkmate dashboard gives you a complete view of your monitoring status. This article explains the main navigation areas and key metrics.",
			},
			{
				type: "heading",
				id: "sidebar-navigation",
				level: 2,
				text: "Sidebar navigation",
			},
			{
				type: "paragraph",
				text: "The left sidebar provides access to all major features:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Uptime", text: "View and manage HTTP, ping, port, and Docker monitors" },
					{ bold: "PageSpeed", text: "Access performance monitoring and Lighthouse reports" },
					{ bold: "Infrastructure", text: "Monitor server hardware metrics" },
					{ bold: "Incidents", text: "View current and past downtime events" },
					{ bold: "Status pages", text: "Create and manage public status pages" },
					{ bold: "Maintenance", text: "Schedule planned maintenance windows" },
					{ bold: "Notifications", text: "Configure alert channels (email, Slack, Discord, etc.)" },
					{ bold: "Settings", text: "Manage account and global settings" },
				],
			},
			{
				type: "heading",
				id: "monitors-list",
				level: 2,
				text: "Monitors list",
			},
			{
				type: "paragraph",
				text: "The main monitors view shows all your monitors with key information at a glance:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Status indicator", text: "Green (up), red (down), or yellow (degraded)" },
					{ bold: "Name", text: "The monitor's display name" },
					{ bold: "URL/Host", text: "The target being monitored" },
					{ bold: "Response time", text: "Latest response time in milliseconds" },
					{ bold: "Uptime", text: "Percentage uptime over the selected period" },
				],
			},
			{
				type: "heading",
				id: "filtering-sorting",
				level: 2,
				text: "Filtering and sorting",
			},
			{
				type: "paragraph",
				text: "You can filter monitors by status (up, down, paused) and sort by name, status, or response time. Use the search box to quickly find specific monitors.",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "uptime-monitoring",
						articleId: "uptime-metrics",
						title: "Understanding uptime metrics",
						description: "Learn what the numbers mean",
					},
					{
						collectionId: "incidents",
						articleId: "understanding-incidents",
						title: "Understanding incidents",
						description: "How downtime is tracked",
					},
				],
			},
		],
	},

	"getting-started/roles-permissions": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Checkmate uses a role-based access control system with three user roles: User, Admin, and Superadmin. Each role has different permissions for managing monitors, team members, and settings.",
			},
			{
				type: "heading",
				id: "user-role",
				level: 2,
				text: "User role",
			},
			{
				type: "paragraph",
				text: "Users have standard access to monitoring features:",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "View all monitors and their status" },
					{ text: "View incidents and history" },
					{ text: "Access status pages" },
				],
			},
			{
				type: "heading",
				id: "admin-role",
				level: 2,
				text: "Admin role",
			},
			{
				type: "paragraph",
				text: "Admins have all User permissions plus management capabilities:",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "Create, edit, and delete monitors" },
					{ text: "Invite new team members" },
					{ text: "Remove team members" },
					{ text: "Change user roles (except Superadmin)" },
					{ text: "Configure notification channels" },
					{ text: "Manage status pages and maintenance windows" },
					{ text: "Access system diagnostics and logs" },
				],
			},
			{
				type: "heading",
				id: "superadmin-role",
				level: 2,
				text: "Superadmin role",
			},
			{
				type: "paragraph",
				text: "Superadmins have full system access:",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "All Admin permissions" },
					{ text: "Configure global application settings" },
					{ text: "Set up SMTP email configuration" },
					{ text: "Manage user accounts and passwords" },
					{ text: "Access all administrative functions" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "The first user to register becomes the Superadmin. Only existing Superadmins can promote other users to Superadmin.",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "team-management",
						articleId: "inviting-members",
						title: "Inviting team members",
						description: "Add people to your team",
					},
					{
						collectionId: "team-management",
						articleId: "user-roles",
						title: "User roles",
						description: "Detailed role comparison",
					},
				],
			},
		],
	},

	// ============================================
	// UPTIME MONITORING COLLECTION
	// ============================================

	"uptime-monitoring/http-monitors": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "HTTP monitors check website and API availability by making HTTP GET requests and validating responses. They verify that the server returns a successful response (status 200-299).",
			},
			{
				type: "heading",
				id: "creating-http-monitor",
				level: 2,
				text: "Creating an HTTP monitor",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Uptime** in the sidebar" },
					{ text: "Click **Create monitor**" },
					{ text: "Select **HTTP/HTTPS** as the monitor type" },
					{ text: "Enter the target URL (include `https://` or `http://`)" },
					{ text: "Configure the settings below" },
					{ text: "Click **Create monitor**" },
				],
			},
			{
				type: "heading",
				id: "configuration-options",
				level: 2,
				text: "Configuration options",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Name", text: "A descriptive name for the monitor (max 50 characters)" },
					{ bold: "URL", text: "The full URL to monitor (must include protocol)" },
					{ bold: "Check interval", text: "How often to check (15 seconds to 30 minutes)" },
					{ bold: "Ignore TLS errors", text: "Skip SSL certificate validation if needed" },
				],
			},
			{
				type: "heading",
				id: "advanced-options",
				level: 3,
				text: "Response validation",
			},
			{
				type: "paragraph",
				text: "You can validate API response content using these options:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Match method", text: "How to compare: equal, include, or regex" },
					{ bold: "Expected value", text: "The value to match against" },
					{ bold: "JSON path", text: "JMESPath expression to extract data from JSON responses" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "HTTP monitors check for successful responses (status 200-299). The monitor uses GET requests by default.",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "uptime-monitoring",
						articleId: "json-path-matching",
						title: "JSON path matching",
						description: "Validate API response content",
					},
					{
						collectionId: "uptime-monitoring",
						articleId: "ssl-tls-monitoring",
						title: "SSL/TLS monitoring",
						description: "Track certificate expiration",
					},
				],
			},
		],
	},

	"uptime-monitoring/ping-monitors": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Ping monitors verify server availability using ICMP echo requests. They're useful for monitoring servers, network devices, and infrastructure that doesn't expose HTTP endpoints.",
			},
			{
				type: "heading",
				id: "creating-ping-monitor",
				level: 2,
				text: "Creating a ping monitor",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Uptime** in the sidebar" },
					{ text: "Click **Create monitor**" },
					{ text: "Select **Ping** as the monitor type" },
					{ text: "Enter the hostname or IP address" },
					{ text: "Set the check interval" },
					{ text: "Click **Create monitor**" },
				],
			},
			{
				type: "heading",
				id: "configuration",
				level: 2,
				text: "Configuration options",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Host", text: "IP address or hostname to ping" },
					{ bold: "Check interval", text: "How often to send ping requests" },
					{ bold: "Timeout", text: "Maximum time to wait for a response" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Some cloud providers and firewalls block ICMP traffic. If ping monitors fail but the server is accessible, consider using HTTP or TCP port monitors instead.",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "uptime-monitoring",
						articleId: "port-monitors",
						title: "Port monitors",
						description: "Monitor specific TCP ports",
					},
				],
			},
		],
	},

	"uptime-monitoring/port-monitors": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Port monitors check TCP port availability on servers. Use them to monitor databases, mail servers, game servers, and other services that listen on specific ports.",
			},
			{
				type: "heading",
				id: "creating-port-monitor",
				level: 2,
				text: "Creating a port monitor",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Uptime** in the sidebar" },
					{ text: "Click **Create monitor**" },
					{ text: "Select **TCP port** as the monitor type" },
					{ text: "Enter the hostname or IP address" },
					{ text: "Enter the port number" },
					{ text: "Set the check interval" },
					{ text: "Click **Create monitor**" },
				],
			},
			{
				type: "heading",
				id: "common-ports",
				level: 2,
				text: "Common ports",
			},
			{
				type: "table",
				columns: [
					{ key: "port", label: "Port", width: "1fr" },
					{ key: "service", label: "Service", width: "2fr" },
				],
				rows: [
					{ port: "22", service: "SSH" },
					{ port: "25", service: "SMTP (email)" },
					{ port: "443", service: "HTTPS" },
					{ port: "3306", service: "MySQL" },
					{ port: "5432", service: "PostgreSQL" },
					{ port: "6379", service: "Redis" },
					{ port: "27017", service: "MongoDB" },
				],
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "uptime-monitoring",
						articleId: "http-monitors",
						title: "HTTP monitors",
						description: "For web services and APIs",
					},
				],
			},
		],
	},

	"uptime-monitoring/intervals-timing": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "The check interval determines how often Checkmate tests your monitors. Choosing the right interval balances quick detection with resource usage.",
			},
			{
				type: "heading",
				id: "available-intervals",
				level: 2,
				text: "Available intervals",
			},
			{
				type: "paragraph",
				text: "Available intervals vary by monitor type:",
			},
			{
				type: "heading",
				id: "uptime-intervals",
				level: 3,
				text: "Uptime monitors",
			},
			{
				type: "table",
				columns: [
					{ key: "interval", label: "Interval", width: "1fr" },
					{ key: "use", label: "Best for", width: "2fr" },
				],
				rows: [
					{ interval: "15 seconds", use: "Ultra-critical services" },
					{ interval: "30 seconds", use: "Critical production services" },
					{ interval: "1-5 minutes", use: "Standard production monitoring" },
					{ interval: "10-15 minutes", use: "Less critical services" },
					{ interval: "30 minutes", use: "Development/staging environments" },
				],
			},
			{
				type: "heading",
				id: "pagespeed-intervals",
				level: 3,
				text: "PageSpeed monitors",
			},
			{
				type: "paragraph",
				text: "PageSpeed checks use longer intervals (3 minutes to 1 week) since Lighthouse audits are resource-intensive.",
			},
			{
				type: "heading",
				id: "choosing-interval",
				level: 2,
				text: "Choosing an interval",
			},
			{
				type: "paragraph",
				text: "Consider these factors when selecting an interval:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Service criticality", text: "Mission-critical services need shorter intervals" },
					{ bold: "Expected downtime impact", text: "High-traffic sites benefit from faster detection" },
					{ bold: "Resource usage", text: "Shorter intervals use more system resources" },
					{ bold: "False positive tolerance", text: "Longer intervals reduce noise from brief glitches" },
				],
			},
			{
				type: "callout",
				variant: "tip",
				text: "Start with 3-minute intervals for most monitors. Decrease to 1 minute only for your most critical services.",
			},
		],
	},

	"uptime-monitoring/json-path-matching": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "JSON path matching allows you to validate API response content beyond just status codes. You can verify that specific fields contain expected values.",
			},
			{
				type: "heading",
				id: "enabling-json-matching",
				level: 2,
				text: "Enabling JSON matching",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Create or edit an HTTP monitor" },
					{ text: "In advanced settings, enable **Response body validation**" },
					{ text: "Enter the JSON path expression" },
					{ text: "Enter the expected value" },
					{ text: "Save the monitor" },
				],
			},
			{
				type: "heading",
				id: "json-path-syntax",
				level: 2,
				text: "JSON path syntax",
			},
			{
				type: "paragraph",
				text: "JSON path uses dot notation to navigate JSON structures:",
			},
			{
				type: "code",
				language: "json",
				text: '// Example API response\n{\n  "status": "healthy",\n  "data": {\n    "version": "2.1.0",\n    "services": ["api", "database"]\n  }\n}',
			},
			{
				type: "table",
				columns: [
					{ key: "path", label: "JSON path", width: "1fr" },
					{ key: "result", label: "Returns", width: "1fr" },
				],
				rows: [
					{ path: "status", result: '"healthy"' },
					{ path: "data.version", result: '"2.1.0"' },
					{ path: "data.services[0]", result: '"api"' },
				],
			},
			{
				type: "callout",
				variant: "warning",
				text: "JSON path matching only works with APIs that return valid JSON. Ensure the response Content-Type is application/json.",
			},
		],
	},

	"uptime-monitoring/ssl-tls-monitoring": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Checkmate automatically monitors SSL/TLS certificates for HTTPS monitors. You can track certificate expiration and receive alerts before certificates expire.",
			},
			{
				type: "heading",
				id: "certificate-tracking",
				level: 2,
				text: "Certificate tracking",
			},
			{
				type: "paragraph",
				text: "For every HTTPS monitor, Checkmate tracks:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Issuer", text: "The certificate authority that issued the certificate" },
					{ bold: "Valid from", text: "When the certificate became valid" },
					{ bold: "Expiration date", text: "When the certificate expires" },
					{ bold: "Days until expiry", text: "Countdown to expiration" },
				],
			},
			{
				type: "heading",
				id: "expiration-alerts",
				level: 2,
				text: "Expiration alerts",
			},
			{
				type: "paragraph",
				text: "Checkmate sends notifications when certificates are approaching expiration. You can configure the warning threshold in monitor settings.",
			},
			{
				type: "callout",
				variant: "tip",
				text: "Set up certificate expiration alerts at least 14 days before expiry to give yourself time to renew.",
			},
			{
				type: "heading",
				id: "certificate-errors",
				level: 2,
				text: "Certificate errors",
			},
			{
				type: "paragraph",
				text: "Checkmate detects common SSL/TLS issues:",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "Expired certificates" },
					{ text: "Self-signed certificates (unless explicitly allowed)" },
					{ text: "Certificate hostname mismatch" },
					{ text: "Incomplete certificate chains" },
				],
			},
		],
	},

	"uptime-monitoring/uptime-metrics": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Checkmate tracks several metrics for each monitor to help you understand availability and performance. This article explains what each metric means.",
			},
			{
				type: "heading",
				id: "uptime-percentage",
				level: 2,
				text: "Uptime percentage",
			},
			{
				type: "paragraph",
				text: "Uptime percentage shows how often your service was available over a time period. It's calculated as:",
			},
			{
				type: "code",
				language: "text",
				text: "Uptime % = (Successful checks / Total checks) × 100",
			},
			{
				type: "table",
				columns: [
					{ key: "uptime", label: "Uptime", width: "1fr" },
					{ key: "downtime", label: "Monthly downtime", width: "1fr" },
				],
				rows: [
					{ uptime: "99.9%", downtime: "~43 minutes" },
					{ uptime: "99.5%", downtime: "~3.6 hours" },
					{ uptime: "99.0%", downtime: "~7.2 hours" },
					{ uptime: "95.0%", downtime: "~36 hours" },
				],
			},
			{
				type: "heading",
				id: "response-time",
				level: 2,
				text: "Response time",
			},
			{
				type: "paragraph",
				text: "Response time measures how long it takes to receive a response from your service. Checkmate shows:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Current", text: "The most recent response time" },
					{ bold: "Average", text: "Mean response time over the period" },
					{ bold: "P95", text: "95th percentile (95% of requests were faster)" },
				],
			},
			{
				type: "heading",
				id: "status-codes",
				level: 2,
				text: "Status codes",
			},
			{
				type: "paragraph",
				text: "For HTTP monitors, Checkmate tracks response status codes. A check is considered successful if the status code matches your expected codes (default: 200).",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "incidents",
						articleId: "understanding-incidents",
						title: "Understanding incidents",
						description: "How downtime creates incidents",
					},
				],
			},
		],
	},

	// ============================================
	// PAGESPEED MONITORING COLLECTION
	// ============================================

	"pagespeed/creating-pagespeed": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "PageSpeed monitors track website performance using Google Lighthouse. They measure loading speed, accessibility, SEO, and best practices to help you optimize your sites.",
			},
			{
				type: "heading",
				id: "creating-monitor",
				level: 2,
				text: "Creating a PageSpeed monitor",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **PageSpeed** in the sidebar" },
					{ text: "Click **Create monitor**" },
					{ text: "Enter the URL to monitor" },
					{ text: "Set the check frequency (daily recommended)" },
					{ text: "Click **Create monitor**" },
				],
			},
			{
				type: "heading",
				id: "configuration",
				level: 2,
				text: "Configuration options",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "URL", text: "The page to analyze (must be publicly accessible)" },
					{ bold: "Display name", text: "Optional friendly name for the monitor" },
					{ bold: "Check frequency", text: "How often to run audits (3 min to 1 week)" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "PageSpeed checks use Google's PageSpeed Insights API. Configure an API key in Settings → PageSpeed for higher rate limits.",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "pagespeed",
						articleId: "understanding-scores",
						title: "Understanding scores",
						description: "What each score means",
					},
					{
						collectionId: "pagespeed",
						articleId: "pagespeed-api",
						title: "PageSpeed API configuration",
						description: "Set up your API key",
					},
				],
			},
		],
	},

	"pagespeed/understanding-scores": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "PageSpeed monitors report four main scores from Google Lighthouse audits. Each score ranges from 0-100, with higher scores indicating better performance.",
			},
			{
				type: "heading",
				id: "score-categories",
				level: 2,
				text: "Score categories",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Performance", text: "Measures loading speed and interactivity" },
					{ bold: "Accessibility", text: "Evaluates usability for people with disabilities" },
					{ bold: "Best practices", text: "Checks for modern web development standards" },
					{ bold: "SEO", text: "Assesses search engine optimization basics" },
				],
			},
			{
				type: "heading",
				id: "score-ranges",
				level: 2,
				text: "Score ranges",
			},
			{
				type: "table",
				columns: [
					{ key: "range", label: "Score", width: "1fr" },
					{ key: "rating", label: "Rating", width: "1fr" },
					{ key: "color", label: "Indicator", width: "1fr" },
				],
				rows: [
					{ range: "90-100", rating: "Good", color: "Green" },
					{ range: "50-89", rating: "Needs improvement", color: "Orange" },
					{ range: "0-49", rating: "Poor", color: "Red" },
				],
			},
			{
				type: "callout",
				variant: "tip",
				text: "Focus on Performance first, as it directly impacts user experience and SEO rankings.",
			},
		],
	},

	"pagespeed/core-web-vitals": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Core Web Vitals are Google's key metrics for measuring user experience. Checkmate tracks these metrics to help you understand and improve page performance.",
			},
			{
				type: "heading",
				id: "lcp",
				level: 2,
				text: "Largest Contentful Paint (LCP)",
			},
			{
				type: "paragraph",
				text: "LCP measures how long it takes for the largest visible element to load. Target: under 2.5 seconds.",
			},
			{
				type: "heading",
				id: "fcp",
				level: 2,
				text: "First Contentful Paint (FCP)",
			},
			{
				type: "paragraph",
				text: "FCP measures when the first content appears on screen. Target: under 1.8 seconds.",
			},
			{
				type: "heading",
				id: "cls",
				level: 2,
				text: "Cumulative Layout Shift (CLS)",
			},
			{
				type: "paragraph",
				text: "CLS measures visual stability—how much the page layout shifts during loading. Target: under 0.1.",
			},
			{
				type: "heading",
				id: "tbt",
				level: 2,
				text: "Total Blocking Time (TBT)",
			},
			{
				type: "paragraph",
				text: "TBT measures how long the page is unresponsive to user input. Target: under 200 milliseconds.",
			},
			{
				type: "heading",
				id: "speed-index",
				level: 2,
				text: "Speed Index",
			},
			{
				type: "paragraph",
				text: "Speed Index measures how quickly content is visually displayed. Target: under 3.4 seconds.",
			},
		],
	},

	"pagespeed/pagespeed-api": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Checkmate uses the Google PageSpeed Insights API to run Lighthouse audits. While the API works without a key, adding one increases your rate limits.",
			},
			{
				type: "heading",
				id: "getting-api-key",
				level: 2,
				text: "Getting an API key",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Go to the Google Cloud Console" },
					{ text: "Create a new project or select an existing one" },
					{ text: "Enable the PageSpeed Insights API" },
					{ text: "Create credentials (API key)" },
					{ text: "Copy the generated API key" },
				],
			},
			{
				type: "heading",
				id: "configuring-key",
				level: 2,
				text: "Configuring the API key",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Settings** in the sidebar" },
					{ text: "Scroll to the **PageSpeed** section" },
					{ text: "Enter your API key in the **PageSpeed API key** field" },
					{ text: "Click **Save** at the bottom of the page" },
				],
			},
			{
				type: "callout",
				variant: "warning",
				text: "Only Admins and Superadmins can configure the PageSpeed API key.",
			},
			{
				type: "callout",
				variant: "info",
				text: "Without an API key, you're limited to a few requests per minute. With a key, you can make thousands of requests per day.",
			},
		],
	},

	"pagespeed/performance-trends": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Performance trends show how your PageSpeed scores change over time. Use them to track the impact of optimizations and catch regressions.",
			},
			{
				type: "heading",
				id: "viewing-trends",
				level: 2,
				text: "Viewing trends",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **PageSpeed** in the sidebar" },
					{ text: "Click on a monitor to view details" },
					{ text: "Select the time range (7 days, 30 days, etc.)" },
					{ text: "View the trend charts for each metric" },
				],
			},
			{
				type: "heading",
				id: "interpreting-trends",
				level: 2,
				text: "Interpreting trends",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Upward trends", text: "Scores improving—your optimizations are working" },
					{ bold: "Downward trends", text: "Scores declining—investigate recent changes" },
					{ bold: "Flat trends", text: "Stable performance—no significant changes" },
					{ bold: "Spikes", text: "Temporary issues—check for one-time events" },
				],
			},
			{
				type: "callout",
				variant: "tip",
				text: "Compare trends before and after deployments to measure the impact of code changes on performance.",
			},
		],
	},

	// ============================================
	// INFRASTRUCTURE MONITORING COLLECTION
	// ============================================

	"infrastructure/installing-capture": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Capture is the companion agent for infrastructure monitoring. Install it on your servers to collect CPU, memory, disk, and network metrics.",
			},
			{
				type: "heading",
				id: "requirements",
				level: 2,
				text: "Requirements",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "Linux, macOS, or Windows server" },
					{ text: "Network access to your Checkmate instance" },
					{ text: "Minimal resources (< 50MB RAM, < 1% CPU)" },
				],
			},
			{
				type: "heading",
				id: "installation",
				level: 2,
				text: "Installation",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Infrastructure** in the sidebar" },
					{ text: "Click **Add server**" },
					{ text: "Copy the installation command" },
					{ text: "Run the command on your server" },
					{ text: "The server appears automatically once connected" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Capture is open source. View the source code at github.com/bluewave-labs/capture",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "infrastructure",
						articleId: "cpu-monitoring",
						title: "CPU monitoring",
						description: "Track processor usage",
					},
					{
						collectionId: "infrastructure",
						articleId: "hardware-thresholds",
						title: "Setting hardware thresholds",
						description: "Configure alerts",
					},
				],
			},
		],
	},

	"infrastructure/cpu-monitoring": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "CPU monitoring tracks processor usage across your servers. High CPU usage can indicate performance issues, runaway processes, or capacity problems.",
			},
			{
				type: "heading",
				id: "metrics",
				level: 2,
				text: "CPU metrics",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Usage percentage", text: "Current CPU utilization (0-100%)" },
					{ bold: "Load average", text: "Average system load over 1, 5, and 15 minutes" },
					{ bold: "Core count", text: "Number of CPU cores available" },
					{ bold: "Temperature", text: "CPU temperature (where supported)" },
				],
			},
			{
				type: "heading",
				id: "typical-values",
				level: 2,
				text: "Typical values",
			},
			{
				type: "table",
				columns: [
					{ key: "usage", label: "Usage", width: "1fr" },
					{ key: "status", label: "Status", width: "2fr" },
				],
				rows: [
					{ usage: "0-30%", status: "Normal—plenty of headroom" },
					{ usage: "30-70%", status: "Moderate—acceptable for production" },
					{ usage: "70-90%", status: "High—consider scaling" },
					{ usage: "90-100%", status: "Critical—immediate attention needed" },
				],
			},
		],
	},

	"infrastructure/memory-monitoring": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Memory monitoring tracks RAM usage on your servers. Running out of memory can cause crashes, slowdowns, and service failures.",
			},
			{
				type: "heading",
				id: "metrics",
				level: 2,
				text: "Memory metrics",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Total memory", text: "Total RAM installed" },
					{ bold: "Used memory", text: "RAM currently in use" },
					{ bold: "Available memory", text: "RAM available for new processes" },
					{ bold: "Usage percentage", text: "Percentage of RAM in use" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Linux systems use available RAM for disk caching. High memory usage isn't always a problem if available memory remains adequate.",
			},
		],
	},

	"infrastructure/disk-monitoring": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Disk monitoring tracks storage space and I/O performance. Running out of disk space can cause application failures and data loss.",
			},
			{
				type: "heading",
				id: "metrics",
				level: 2,
				text: "Disk metrics",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Total space", text: "Total disk capacity" },
					{ bold: "Used space", text: "Space currently in use" },
					{ bold: "Available space", text: "Free space remaining" },
					{ bold: "Usage percentage", text: "Percentage of disk used" },
				],
			},
			{
				type: "callout",
				variant: "warning",
				text: "Set alerts at 80% disk usage to give yourself time to add storage or clean up files before running out of space.",
			},
		],
	},

	"infrastructure/network-monitoring": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Network monitoring tracks bandwidth usage and packet statistics. Use it to identify bottlenecks and unusual traffic patterns.",
			},
			{
				type: "heading",
				id: "metrics",
				level: 2,
				text: "Network metrics",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Bytes received", text: "Incoming data volume" },
					{ bold: "Bytes sent", text: "Outgoing data volume" },
					{ bold: "Packets received", text: "Incoming packet count" },
					{ bold: "Packets sent", text: "Outgoing packet count" },
				],
			},
		],
	},

	"infrastructure/hardware-thresholds": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Hardware thresholds define when Checkmate sends alerts about resource usage. Set thresholds to catch problems before they affect your services.",
			},
			{
				type: "heading",
				id: "configuring-thresholds",
				level: 2,
				text: "Configuring thresholds",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Infrastructure** in the sidebar" },
					{ text: "Click on a server to view details" },
					{ text: "Click **Settings** or the gear icon" },
					{ text: "Set threshold percentages for CPU, memory, and disk" },
					{ text: "Click **Save**" },
				],
			},
			{
				type: "heading",
				id: "recommended-thresholds",
				level: 2,
				text: "Recommended thresholds",
			},
			{
				type: "table",
				columns: [
					{ key: "resource", label: "Resource", width: "1fr" },
					{ key: "warning", label: "Warning", width: "1fr" },
					{ key: "critical", label: "Critical", width: "1fr" },
				],
				rows: [
					{ resource: "CPU", warning: "70%", critical: "90%" },
					{ resource: "Memory", warning: "80%", critical: "95%" },
					{ resource: "Disk", warning: "80%", critical: "90%" },
				],
			},
			{
				type: "callout",
				variant: "tip",
				text: "Start with these defaults and adjust based on your application's normal behavior.",
			},
		],
	},

	// ============================================
	// INCIDENTS COLLECTION
	// ============================================

	"incidents/understanding-incidents": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "An incident is created when a monitor detects a failure. Checkmate tracks incident start time, duration, and resolution to help you analyze downtime patterns.",
			},
			{
				type: "heading",
				id: "incident-creation",
				level: 2,
				text: "When incidents are created",
			},
			{
				type: "paragraph",
				text: "Incidents are created when:",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "An HTTP monitor receives an unexpected status code" },
					{ text: "A ping or port monitor fails to connect" },
					{ text: "A monitor times out without response" },
					{ text: "Infrastructure thresholds are exceeded" },
				],
			},
			{
				type: "heading",
				id: "incident-states",
				level: 2,
				text: "Incident states",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Active", text: "The monitor is currently down" },
					{ bold: "Resolved", text: "The monitor has recovered" },
				],
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "incidents",
						articleId: "incident-timeline",
						title: "Incident timeline",
						description: "Track incident progression",
					},
					{
						collectionId: "incidents",
						articleId: "resolving-incidents",
						title: "Resolving incidents",
						description: "Manual vs automatic resolution",
					},
				],
			},
		],
	},

	"incidents/incident-timeline": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "The incident timeline shows the progression of an incident from detection to resolution. Use it to understand what happened and when.",
			},
			{
				type: "heading",
				id: "timeline-events",
				level: 2,
				text: "Timeline events",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Started", text: "When the first failure was detected" },
					{ bold: "Notifications sent", text: "When alerts were dispatched" },
					{ bold: "Acknowledged", text: "When someone began investigating (if applicable)" },
					{ bold: "Resolved", text: "When the monitor recovered" },
				],
			},
			{
				type: "heading",
				id: "duration",
				level: 2,
				text: "Duration tracking",
			},
			{
				type: "paragraph",
				text: "Checkmate calculates incident duration from the first failed check to the first successful check after the incident. This appears in both the timeline and incident summary.",
			},
		],
	},

	"incidents/resolving-incidents": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Incidents can be resolved automatically when the monitor recovers, or manually if you want to mark an issue as fixed.",
			},
			{
				type: "heading",
				id: "automatic-resolution",
				level: 2,
				text: "Automatic resolution",
			},
			{
				type: "paragraph",
				text: "By default, incidents resolve automatically when the monitor returns to a healthy state. A recovery notification is sent to all configured channels.",
			},
			{
				type: "heading",
				id: "manual-resolution",
				level: 2,
				text: "Manual resolution",
			},
			{
				type: "paragraph",
				text: "You can also manually resolve incidents:",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Incidents** in the sidebar" },
					{ text: "Find the active incident" },
					{ text: "Click **Resolve**" },
					{ text: "Optionally add a resolution note" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Manual resolution is useful when you know the underlying issue is fixed but the monitor hasn't run its next check yet.",
			},
		],
	},

	"incidents/incident-history": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Incident history provides a record of all past outages. Use it to identify patterns, measure reliability, and report on SLA compliance.",
			},
			{
				type: "heading",
				id: "viewing-history",
				level: 2,
				text: "Viewing incident history",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Incidents** in the sidebar" },
					{ text: "Use filters to narrow by monitor, date range, or status" },
					{ text: "Click an incident to view its full timeline" },
				],
			},
			{
				type: "heading",
				id: "analyzing-patterns",
				level: 2,
				text: "Analyzing patterns",
			},
			{
				type: "paragraph",
				text: "Look for these patterns in your incident history:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Recurring times", text: "Incidents at the same time might indicate scheduled jobs or traffic spikes" },
					{ bold: "Duration trends", text: "Longer incidents may indicate slower recovery processes" },
					{ bold: "Frequency changes", text: "Increasing incidents could signal infrastructure problems" },
				],
			},
		],
	},

	// ============================================
	// NOTIFICATIONS COLLECTION
	// ============================================

	"notifications/email-notifications": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Email notifications send alerts directly to your inbox when monitors detect issues. Configure SMTP settings to enable email delivery.",
			},
			{
				type: "heading",
				id: "smtp-setup",
				level: 2,
				text: "Setting up SMTP",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Settings** in the sidebar" },
					{ text: "Select the **Email** tab" },
					{ text: "Enter your SMTP server details" },
					{ text: "Configure authentication (username/password)" },
					{ text: "Set the sender email address" },
					{ text: "Click **Save** and **Test** to verify" },
				],
			},
			{
				type: "heading",
				id: "smtp-settings",
				level: 2,
				text: "SMTP settings",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Host", text: "SMTP server address (e.g., smtp.gmail.com)" },
					{ bold: "Port", text: "SMTP port (typically 587 for TLS, 465 for SSL)" },
					{ bold: "Username", text: "Authentication username" },
					{ bold: "Password", text: "Authentication password or app password" },
					{ bold: "From address", text: "Email address that alerts come from" },
				],
			},
			{
				type: "callout",
				variant: "tip",
				text: "For Gmail, use an App Password instead of your regular password. Enable 2FA and generate an app password in your Google Account settings.",
			},
		],
	},

	"notifications/slack-integration": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Slack integration sends incident alerts to your Slack channels using webhooks. Your team can see and discuss issues in real-time.",
			},
			{
				type: "heading",
				id: "creating-webhook",
				level: 2,
				text: "Creating a Slack webhook",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Go to api.slack.com/apps and create a new app" },
					{ text: "Select **Incoming Webhooks** and enable them" },
					{ text: "Click **Add New Webhook to Workspace**" },
					{ text: "Choose the channel for alerts" },
					{ text: "Copy the webhook URL" },
				],
			},
			{
				type: "heading",
				id: "configuring-checkmate",
				level: 2,
				text: "Configuring in Checkmate",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Integrations** in the sidebar" },
					{ text: "Click **Create integration**" },
					{ text: "Select **Slack**" },
					{ text: "Paste your webhook URL" },
					{ text: "Click **Test** to send a test message" },
					{ text: "Click **Save**" },
				],
			},
		],
	},

	"notifications/discord-integration": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Discord integration sends alerts to your Discord server using webhooks. Ideal for development teams already using Discord for communication.",
			},
			{
				type: "heading",
				id: "creating-webhook",
				level: 2,
				text: "Creating a Discord webhook",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Open Discord and go to your server" },
					{ text: "Click the gear icon next to the target channel" },
					{ text: "Select **Integrations** → **Webhooks**" },
					{ text: "Click **New Webhook**" },
					{ text: "Name the webhook and copy the URL" },
				],
			},
			{
				type: "heading",
				id: "configuring-checkmate",
				level: 2,
				text: "Configuring in Checkmate",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Integrations** in the sidebar" },
					{ text: "Click **Create integration**" },
					{ text: "Select **Discord**" },
					{ text: "Paste your webhook URL" },
					{ text: "Click **Test** then **Save**" },
				],
			},
		],
	},

	"notifications/pagerduty-integration": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "PagerDuty integration connects Checkmate to your on-call schedules. Incidents trigger PagerDuty alerts with proper escalation policies.",
			},
			{
				type: "heading",
				id: "setup",
				level: 2,
				text: "Setting up PagerDuty",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "In PagerDuty, go to **Services** and create or select a service" },
					{ text: "Add a new integration of type **Events API v2**" },
					{ text: "Copy the Integration Key (routing key)" },
					{ text: "In Checkmate, navigate to **Integrations**" },
					{ text: "Create a new **PagerDuty** integration" },
					{ text: "Paste the integration key and save" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "PagerDuty incidents are automatically resolved when Checkmate detects recovery.",
			},
		],
	},

	"notifications/webhook-notifications": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Webhook notifications send HTTP POST requests to your custom endpoint when incidents occur. Use them to integrate with any service.",
			},
			{
				type: "heading",
				id: "setup",
				level: 2,
				text: "Setting up webhooks",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Integrations** in the sidebar" },
					{ text: "Click **Create integration**" },
					{ text: "Select **Webhook**" },
					{ text: "Enter your endpoint URL" },
					{ text: "Click **Test** then **Save**" },
				],
			},
			{
				type: "heading",
				id: "payload",
				level: 2,
				text: "Webhook payload",
			},
			{
				type: "paragraph",
				text: "Checkmate sends a JSON payload with incident details:",
			},
			{
				type: "code",
				language: "json",
				text: '{\n  "type": "incident.created",\n  "monitor": {\n    "id": "abc123",\n    "name": "Production API",\n    "url": "https://api.example.com"\n  },\n  "incident": {\n    "id": "inc_456",\n    "status": "active",\n    "startedAt": "2024-01-15T10:30:00Z"\n  }\n}',
			},
		],
	},

	"notifications/matrix-integration": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Matrix integration sends alerts to Matrix rooms using the Matrix protocol. Ideal for teams using decentralized messaging.",
			},
			{
				type: "heading",
				id: "setup",
				level: 2,
				text: "Setting up Matrix",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Get your Matrix homeserver URL" },
					{ text: "Create an access token for your bot account" },
					{ text: "Get the room ID where alerts should be sent" },
					{ text: "In Checkmate, navigate to **Integrations**" },
					{ text: "Create a new **Matrix** integration" },
					{ text: "Enter the homeserver, token, and room ID" },
					{ text: "Click **Test** then **Save**" },
				],
			},
		],
	},

	"notifications/testing-notifications": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Always test your notification integrations to ensure alerts reach your team. Checkmate provides a test function for every integration type.",
			},
			{
				type: "heading",
				id: "testing",
				level: 2,
				text: "Testing an integration",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Integrations** in the sidebar" },
					{ text: "Find the integration you want to test" },
					{ text: "Click the **Test** button" },
					{ text: "Check the destination for the test message" },
					{ text: "Verify the message arrived correctly" },
				],
			},
			{
				type: "heading",
				id: "troubleshooting",
				level: 2,
				text: "Troubleshooting",
			},
			{
				type: "paragraph",
				text: "If test messages don't arrive:",
			},
			{
				type: "bullet-list",
				items: [
					{ text: "Verify the webhook URL or credentials are correct" },
					{ text: "Check if your firewall allows outbound connections" },
					{ text: "Ensure the destination service is operational" },
					{ text: "Review server logs for error messages" },
				],
			},
		],
	},

	// ============================================
	// STATUS PAGES COLLECTION
	// ============================================

	"status-pages/creating-status-page": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Status pages provide a public view of your service health. Share them with customers to communicate uptime and incidents transparently.",
			},
			{
				type: "heading",
				id: "creating",
				level: 2,
				text: "Creating a status page",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Status pages** in the sidebar" },
					{ text: "Click **Create status page**" },
					{ text: "Enter a name for your status page" },
					{ text: "Configure the URL slug (e.g., status.yourcompany.com)" },
					{ text: "Click **Create**" },
				],
			},
			{
				type: "heading",
				id: "adding-monitors",
				level: 2,
				text: "Adding monitors",
			},
			{
				type: "paragraph",
				text: "After creation, add monitors to display on the status page. Visitors can see the status of each service without accessing your dashboard.",
			},
			{
				type: "article-links",
				title: "Related articles",
				items: [
					{
						collectionId: "status-pages",
						articleId: "customizing-appearance",
						title: "Customizing appearance",
						description: "Brand your status page",
					},
					{
						collectionId: "status-pages",
						articleId: "adding-monitors",
						title: "Adding monitors",
						description: "Configure which services to show",
					},
				],
			},
		],
	},

	"status-pages/customizing-appearance": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Customize your status page to match your brand. Add your logo, choose colors, and configure the layout.",
			},
			{
				type: "heading",
				id: "branding",
				level: 2,
				text: "Branding options",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Logo", text: "Upload your company logo (JPEG/PNG, max 3MB)" },
					{ bold: "Company name", text: "Display name at the top of the page" },
					{ bold: "Color", text: "Primary color for the status page theme" },
					{ bold: "Timezone", text: "Timezone for displaying check times" },
				],
			},
			{
				type: "heading",
				id: "applying",
				level: 2,
				text: "Applying customizations",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Status pages** and select your page" },
					{ text: "Click **Settings** or the gear icon" },
					{ text: "Upload your logo and configure branding" },
					{ text: "Click **Save**" },
				],
			},
		],
	},

	"status-pages/adding-monitors": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Choose which monitors appear on your status page. You can group related services and display them with custom names.",
			},
			{
				type: "heading",
				id: "adding",
				level: 2,
				text: "Adding monitors",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Status pages** and select your page" },
					{ text: "Click **Add monitor**" },
					{ text: "Select monitors from the list" },
					{ text: "Optionally set display names" },
					{ text: "Click **Save**" },
				],
			},
			{
				type: "heading",
				id: "organizing",
				level: 2,
				text: "Organizing monitors",
			},
			{
				type: "paragraph",
				text: "Drag monitors to reorder them. Group related services together for a logical presentation.",
			},
		],
	},

	"status-pages/display-options": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Configure what information visitors see on your status page. Balance transparency with the level of detail you want to share.",
			},
			{
				type: "heading",
				id: "options",
				level: 2,
				text: "Display options",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Show uptime percentage", text: "Display overall uptime statistics for each monitor" },
					{ bold: "Show charts", text: "Display response time performance graphs" },
					{ bold: "Show admin login link", text: "Add a link to the Checkmate login page" },
					{ bold: "Publish/Unpublish", text: "Control whether the page is publicly accessible" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Unpublished status pages are only accessible by team members logged into Checkmate.",
			},
		],
	},

	"status-pages/sharing": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Share your status page with customers and stakeholders to communicate service health transparently.",
			},
			{
				type: "heading",
				id: "public-url",
				level: 2,
				text: "Public URL",
			},
			{
				type: "paragraph",
				text: "Each status page has a unique URL based on the slug you configured. Share this URL with anyone who needs to check your service status.",
			},
			{
				type: "callout",
				variant: "tip",
				text: "Use a descriptive URL slug like 'api-status' or 'app-health' to make the link memorable.",
			},
		],
	},

	// ============================================
	// MAINTENANCE COLLECTION
	// ============================================

	"maintenance/creating-maintenance": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Maintenance windows suppress alerts during planned downtime. Schedule them before deployments or infrastructure work to avoid false alarms.",
			},
			{
				type: "heading",
				id: "creating",
				level: 2,
				text: "Creating a maintenance window",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Maintenance** in the sidebar" },
					{ text: "Click **Create maintenance window**" },
					{ text: "Enter a name describing the maintenance" },
					{ text: "Select the affected monitors" },
					{ text: "Set the start and end times" },
					{ text: "Click **Create**" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Monitors continue running during maintenance, but incidents won't trigger notifications.",
			},
		],
	},

	"maintenance/recurring-maintenance": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Choose between one-time and recurring maintenance windows based on your needs.",
			},
			{
				type: "heading",
				id: "one-time",
				level: 2,
				text: "One-time maintenance",
			},
			{
				type: "paragraph",
				text: "Use one-time windows for specific events like deployments, migrations, or emergency repairs. They run once at the scheduled time.",
			},
			{
				type: "heading",
				id: "recurring",
				level: 2,
				text: "Recurring maintenance",
			},
			{
				type: "paragraph",
				text: "Use recurring windows for regular maintenance like nightly backups or weekly updates. Options include:",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Daily", text: "Runs every day at the specified time" },
					{ bold: "Weekly", text: "Runs every 7 days at the specified time" },
				],
			},
		],
	},

	"maintenance/managing-maintenance": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Manage active maintenance windows to extend, cancel, or modify them as needed.",
			},
			{
				type: "heading",
				id: "managing",
				level: 2,
				text: "Managing windows",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Maintenance** in the sidebar" },
					{ text: "Find the active or scheduled window" },
					{ text: "Click to view details" },
					{ text: "Use **Edit** to modify or **Cancel** to remove" },
				],
			},
			{
				type: "heading",
				id: "extending",
				level: 2,
				text: "Extending maintenance",
			},
			{
				type: "paragraph",
				text: "If maintenance takes longer than expected, edit the window to extend the end time. This prevents alerts from firing while work continues.",
			},
		],
	},

	// ============================================
	// TEAM MANAGEMENT COLLECTION
	// ============================================

	"team-management/inviting-members": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Invite team members to collaborate on monitoring. New members receive an email invitation to join your workspace.",
			},
			{
				type: "heading",
				id: "inviting",
				level: 2,
				text: "Sending invitations",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Click your profile icon and select **Account**" },
					{ text: "Go to the **Team** section" },
					{ text: "Click **Invite member**" },
					{ text: "Enter their email address" },
					{ text: "Select their role (User or Admin)" },
					{ text: "Click **Send invitation**" },
				],
			},
			{
				type: "callout",
				variant: "warning",
				text: "Invitations expire after 1 hour. Send a new invitation if the link has expired.",
			},
		],
	},

	"team-management/user-roles": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Checkmate has three user roles with different permission levels. Assign roles based on what each team member needs to do.",
			},
			{
				type: "heading",
				id: "comparison",
				level: 2,
				text: "Role comparison",
			},
			{
				type: "table",
				columns: [
					{ key: "permission", label: "Permission", width: "2fr" },
					{ key: "user", label: "User", width: "1fr" },
					{ key: "admin", label: "Admin", width: "1fr" },
					{ key: "superadmin", label: "Superadmin", width: "1fr" },
				],
				rows: [
					{ permission: "View monitors", user: "✓", admin: "✓", superadmin: "✓" },
					{ permission: "Create/edit monitors", user: "—", admin: "✓", superadmin: "✓" },
					{ permission: "Manage notifications", user: "—", admin: "✓", superadmin: "✓" },
					{ permission: "Invite team members", user: "—", admin: "✓", superadmin: "✓" },
					{ permission: "Configure SMTP", user: "—", admin: "—", superadmin: "✓" },
					{ permission: "Manage user accounts", user: "—", admin: "—", superadmin: "✓" },
				],
			},
		],
	},

	"team-management/managing-access": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Manage team member access by changing roles or removing members who no longer need access.",
			},
			{
				type: "heading",
				id: "changing-roles",
				level: 2,
				text: "Changing roles",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Click your profile icon and select **Account**" },
					{ text: "Go to the **Team** section" },
					{ text: "Find the team member" },
					{ text: "Click their current role to change it" },
					{ text: "Select the new role and confirm" },
				],
			},
			{
				type: "heading",
				id: "removing",
				level: 2,
				text: "Removing members",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Click your profile icon and select **Account**" },
					{ text: "Go to the **Team** section" },
					{ text: "Find the team member" },
					{ text: "Click the remove button" },
					{ text: "Confirm removal" },
				],
			},
			{
				type: "callout",
				variant: "warning",
				text: "Removed members lose access immediately but their past actions remain in the audit log.",
			},
		],
	},

	// ============================================
	// SETTINGS COLLECTION
	// ============================================

	"settings/email-configuration": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Configure SMTP settings to enable email notifications. This is required for email alerts and team invitations.",
			},
			{
				type: "heading",
				id: "configuration",
				level: 2,
				text: "SMTP configuration",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Settings** in the sidebar" },
					{ text: "Scroll to the **Email** section" },
					{ text: "Enter SMTP server hostname and port" },
					{ text: "Enter authentication credentials (username and password)" },
					{ text: "Set the from email address" },
					{ text: "Configure TLS/SSL options as needed" },
					{ text: "Click **Send test email** to verify, then **Save**" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Only Admins and Superadmins can configure SMTP settings.",
			},
		],
	},

	"settings/global-thresholds": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Global thresholds set default alert levels for infrastructure monitors. These thresholds determine when alerts are triggered for resource usage.",
			},
			{
				type: "heading",
				id: "configuring",
				level: 2,
				text: "Configuring thresholds",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Settings** in the sidebar" },
					{ text: "Scroll to the **Global thresholds** section" },
					{ text: "Set threshold percentages for CPU, memory, disk, and temperature" },
					{ text: "Click **Save** at the bottom of the page" },
				],
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "CPU threshold", text: "Alert when CPU usage exceeds this percentage (1-100%)" },
					{ bold: "Memory threshold", text: "Alert when memory usage exceeds this percentage (1-100%)" },
					{ bold: "Disk threshold", text: "Alert when disk usage exceeds this percentage (1-100%)" },
					{ bold: "Temperature threshold", text: "Alert when temperature exceeds this value (1-150°C)" },
				],
			},
		],
	},

	"settings/appearance": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Customize the appearance of Checkmate to match your preferences.",
			},
			{
				type: "heading",
				id: "theme",
				level: 2,
				text: "Theme settings",
			},
			{
				type: "bullet-list",
				items: [
					{ bold: "Light/Dark mode", text: "Toggle between light and dark themes" },
					{ bold: "Language", text: "Select your preferred language" },
					{ bold: "Show URLs", text: "Toggle whether to display monitor URLs in the interface" },
				],
			},
			{
				type: "paragraph",
				text: "These settings are saved to your browser and persist across sessions.",
			},
		],
	},

	"settings/timezone-settings": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Timezone settings control how dates and times are displayed throughout the application. Set this to your local timezone for easier incident correlation.",
			},
			{
				type: "heading",
				id: "configuring",
				level: 2,
				text: "Setting your timezone",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Settings** in the sidebar" },
					{ text: "Find the **Timezone** section at the top" },
					{ text: "Search for and select your timezone" },
					{ text: "Click **Save** at the bottom of the page" },
				],
			},
		],
	},

	"settings/export-monitors": {
		blocks: [
			{
				type: "heading",
				id: "overview",
				level: 2,
				text: "Overview",
			},
			{
				type: "paragraph",
				text: "Export your monitors to backup your configuration or migrate to another Checkmate instance.",
			},
			{
				type: "heading",
				id: "exporting",
				level: 2,
				text: "Exporting monitors",
			},
			{
				type: "ordered-list",
				items: [
					{ text: "Navigate to **Settings** in the sidebar" },
					{ text: "Scroll to the **Export monitors** section" },
					{ text: "Click **Export monitors to JSON**" },
					{ text: "Save the downloaded file" },
				],
			},
			{
				type: "callout",
				variant: "info",
				text: "Only Admins and Superadmins can export monitors.",
			},
		],
	},
};

/**
 * Get article content by collection and article ID
 * @param {string} collectionId
 * @param {string} articleId
 * @returns {Object|undefined}
 */
export const getArticleContent = (collectionId, articleId) => {
	const key = `${collectionId}/${articleId}`;
	return articleContents[key];
};

export default articleContents;

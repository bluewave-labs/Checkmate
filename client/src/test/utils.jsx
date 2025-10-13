import { render } from "@testing-library/react";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n-mock";

// Create a basic theme for testing
const theme = createTheme({
	palette: {
		primary: {
			main: "#1976d2",
			lowContrast: "#e3f2fd",
			contrastTextSecondary: "#666",
			contrastTextTertiary: "#999",
		},
		tertiary: {
			background: "#f5f5f5",
			main: "#f0f0f0",
		},
		success: {
			main: "#4caf50",
		},
		warning: {
			main: "#ff9800",
		},
		error: {
			main: "#f44336",
		},
	},
	spacing: (factor) => `${0.25 * factor}rem`,
});

// Custom render function with providers
export function renderWithProviders(ui, options = {}) {
	function Wrapper({ children }) {
		return (
			<ThemeProvider theme={theme}>
				<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
			</ThemeProvider>
		);
	}

	return render(ui, { wrapper: Wrapper, ...options });
}

// Mock monitor data for testing
export const mockMonitors = [
	{
		_id: "1",
		name: "Database Server",
		url: "https://db.example.com",
		group: "Infrastructure",
		status: "up",
		uptimePercentage: 0.99,
		checks: [
			{
				cpu: {
					frequency: 2800,
					usage_percent: 0.65,
				},
				memory: {
					usage_percent: 0.75,
				},
				disk: [
					{
						usage_percent: 0.85,
					},
				],
			},
		],
	},
	{
		_id: "2",
		name: "Web Server",
		url: "https://web.example.com",
		group: "Infrastructure",
		status: "up",
		uptimePercentage: 0.98,
		checks: [
			{
				cpu: {
					frequency: 3200,
					usage_percent: 0.45,
				},
				memory: {
					usage_percent: 0.55,
				},
				disk: [
					{
						usage_percent: 0.65,
					},
				],
			},
		],
	},
	{
		_id: "3",
		name: "API Endpoint",
		url: "https://api.example.com",
		group: "Services",
		status: "down",
		uptimePercentage: 0.95,
		checks: [
			{
				cpu: {
					frequency: 2400,
					usage_percent: 0.3,
				},
				memory: {
					usage_percent: 0.4,
				},
				disk: [
					{
						usage_percent: 0.5,
					},
				],
			},
		],
	},
	{
		_id: "4",
		name: "Backup System",
		url: "https://backup.example.com",
		group: null, // Ungrouped monitor
		status: "up",
		uptimePercentage: 0.97,
		checks: [
			{
				cpu: {
					frequency: 2000,
					usage_percent: 0.2,
				},
				memory: {
					usage_percent: 0.3,
				},
				disk: [
					{
						usage_percent: 0.4,
					},
				],
			},
		],
	},
	{
		_id: "5",
		name: "Cache Server",
		url: "https://cache.example.com",
		group: "", // Empty string group (should be treated as ungrouped)
		status: "up",
		uptimePercentage: 0.99,
		checks: [
			{
				cpu: {
					frequency: 3000,
					usage_percent: 0.35,
				},
				memory: {
					usage_percent: 0.45,
				},
				disk: [
					{
						usage_percent: 0.55,
					},
				],
			},
		],
	},
];

// Mock groups data
export const mockGroups = [
	{ name: "Infrastructure" },
	{ name: "Services" },
	{ name: "Development" },
];

export * from "@testing-library/react";

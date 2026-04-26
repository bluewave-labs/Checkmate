import Logo from "@/assets/icons/checkmate-icon.svg?react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import {
	ErrorFallback,
	EmptyFallback,
	EmptyMonitorFallback,
} from "@/Components/design-elements/Fallback";
import { EmptyState } from "@/Components/design-elements/EmptyState";
import { Breadcrumb } from "@/Components/design-elements/Breadcrumb";
import { PageHeader } from "@/Components/design-elements/PageHeader";
import CircularProgress from "@mui/material/CircularProgress";
import { HeaderAuthControls } from "@/Pages/Auth/components/HeaderAuthControls";
import { LanguageSelector, SwitchTheme } from "@/Components/inputs";

import type { StackProps } from "@mui/material/Stack";
import { useTheme, alpha } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Typography } from "@mui/material";

export const PageSpeedKeyPriorityFallback = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const alertBg = alpha(theme.palette.warning.main, 0.08);
	const alertBorder = alpha(theme.palette.warning.main, 0.45);
	const alertIcon = theme.palette.warning.main;
	return (
		<EmptyState
			fullscreen
			title={t("pages.pageSpeed.fallback.title")}
			description={t("pages.pageSpeed.fallback.description")}
			alert={
				<Stack
					direction="row"
					alignItems="flex-start"
					gap={theme.spacing(LAYOUT.SM)}
					sx={{
						width: "100%",
						p: theme.spacing(LAYOUT.MD),
						borderRadius: 1,
						border: `1px solid ${alertBorder}`,
						backgroundColor: alertBg,
						textAlign: "left",
					}}
				>
					<Box
						component="span"
						sx={{
							color: alertIcon,
							fontSize: 18,
							lineHeight: 1,
							mt: "2px",
						}}
					>
						⚠
					</Box>
					<Typography
						sx={{ color: theme.palette.text.primary, lineHeight: 1.55, fontSize: 13 }}
					>
						<Trans
							i18nKey="common.alerts.pageSpeedApiKey.content"
							components={{
								settingsLink: (
									<Link
										component={RouterLink}
										to="/settings"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 600,
											textDecoration: "underline",
										}}
									/>
								),
							}}
						/>
					</Typography>
				</Stack>
			}
		/>
	);
};

interface BasePageProps extends StackProps {
	loading?: boolean;
	error?: boolean;
	children: React.ReactNode;
	breadcrumbOverride?: string[];
	headerKey?: string;
	backTo?: string;
	backLabel?: string;
}

export const BasePage = ({
	loading,
	error,
	children,
	breadcrumbOverride,
	headerKey,
	backTo,
	backLabel,
	...props
}: BasePageProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (loading) {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				sx={{ height: "100%" }}
			>
				<CircularProgress
					color="primary"
					size={28}
				/>
			</Stack>
		);
	}

	if (error) {
		return (
			<ErrorFallback
				title="Something went wrong..."
				subtitle="Please try again later"
			/>
		);
	}

	return (
		<Stack
			spacing={theme.spacing(LAYOUT.LG)}
			{...props}
		>
			{headerKey ? (
				<PageHeader
					title={t(`pages.${headerKey}.header.title`)}
					description={t(`pages.${headerKey}.header.description`)}
					backTo={backTo}
					backLabel={backLabel}
				/>
			) : (
				<Breadcrumb breadcrumbOverride={breadcrumbOverride} />
			)}
			{children}
		</Stack>
	);
};

interface BasePageWithStatesProps extends StackProps {
	loading: boolean;
	error: any;
	totalCount: number;
	description?: string;
	page: string;
	actionButtonText: string;
	actionLink: string;
	children: React.ReactNode;
	headerKey?: string;
}

export const BasePageWithStates = ({
	loading,
	error,
	totalCount,
	page,
	description,
	actionButtonText,
	actionLink,
	children,
	headerKey,
	...props
}: BasePageWithStatesProps) => {
	const showLoading = loading && totalCount === 0;

	if (!loading && totalCount === 0) {
		return (
			<EmptyFallback
				description={description}
				title={page}
				actionButtonText={actionButtonText}
				actionLink={actionLink}
			/>
		);
	}

	return (
		<BasePage
			loading={showLoading}
			error={error}
			headerKey={headerKey}
			{...props}
		>
			{children}
		</BasePage>
	);
};

interface MonitorBasePageWithStatesProps extends StackProps {
	loading: boolean;
	error: any;
	totalCount: number;
	page: string;
	actionLink?: string;
	children: React.ReactNode;
	priorityFallback?: React.ReactNode;
	headerKey?: string;
}

export const MonitorBasePageWithStates = ({
	loading,
	error,
	totalCount,
	page,
	actionLink,
	children,
	priorityFallback,
	headerKey,
	...props
}: MonitorBasePageWithStatesProps) => {
	const { t } = useTranslation();

	const showLoading = loading && totalCount === 0;

	if (priorityFallback) {
		return <>{priorityFallback}</>;
	}

	if (!loading && totalCount === 0) {
		return (
			<EmptyMonitorFallback
				page={page}
				title={t(`pages.${page}.fallback.title`)}
				description={t(`pages.${page}.fallback.description`)}
				actionButtonText={t(`pages.${page}.fallback.actionButton`)}
				actionLink={actionLink || ""}
			/>
		);
	}

	return (
		<BasePage
			loading={showLoading}
			error={error}
			headerKey={headerKey}
			{...props}
		>
			{children}
		</BasePage>
	);
};

interface BaseAuthPageProps extends React.PropsWithChildren, StackProps {
	title: string;
	subtitle: string;
}

export const BaseAuthPage = ({
	title,
	subtitle,
	children,
	component,
	onSubmit,
}: BaseAuthPageProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			minHeight="100vh"
			width="100%"
			position="relative"
			sx={{ backgroundColor: theme.palette.background.default }}
		>
			<Stack
				flex={1}
				alignItems="center"
				justifyContent="center"
				position="relative"
				px={theme.spacing(LAYOUT.MD)}
				py={{ xs: theme.spacing(20), md: theme.spacing(12) }}
			>
				<Stack
					direction="row"
					spacing={theme.spacing(2)}
					alignItems="center"
					sx={{
						position: "absolute",
						top: theme.spacing(LAYOUT.MD),
						right: theme.spacing(LAYOUT.MD),
						zIndex: 3,
					}}
				>
					<LanguageSelector />
					<SwitchTheme />
				</Stack>
				<Stack
					component={component}
					onSubmit={onSubmit}
					gap={theme.spacing(LAYOUT.MD)}
					width="100%"
					maxWidth={360}
				>
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(3)}
						mb={theme.spacing(2)}
					>
						<Box width={28}>
							<Logo width="100%" />
						</Box>
						<Typography sx={{ fontWeight: 500, letterSpacing: "-0.01em", fontSize: 16 }}>
							{t("common.appName")}
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(2)}>
						<Typography
							sx={{
								fontSize: 26,
								fontWeight: 400,
								lineHeight: 1.15,
								letterSpacing: "-0.02em",
								color: theme.palette.text.primary,
							}}
						>
							{title}
						</Typography>
						<Typography
							sx={{
								fontSize: 14,
								color: theme.palette.text.secondary,
							}}
						>
							{subtitle}
						</Typography>
					</Stack>
					{children}
				</Stack>
			</Stack>
			<Stack
				flex={1}
				justifyContent="space-between"
				display={{ xs: "none", md: "flex" }}
				sx={{
					background: "linear-gradient(135deg, #0c4d3d 0%, #155a48 60%, #0f5d4a 100%)",
					color: "#fff",
					p: theme.spacing(28),
					position: "relative",
					overflow: "hidden",
					"&::after": {
						content: '""',
						position: "absolute",
						inset: 0,
						backgroundImage: `
							linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
							linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
							linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%),
							linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)
						`,
						backgroundSize: "80px 80px",
						backgroundPosition: "0 0, 0 40px, 40px -40px, -40px 0px",
						maskImage: "linear-gradient(135deg, transparent 0%, black 70%)",
						WebkitMaskImage: "linear-gradient(135deg, transparent 0%, black 70%)",
						pointerEvents: "none",
					},
				}}
			>
				<div />
				<Stack sx={{ position: "relative", zIndex: 1, gap: theme.spacing(4) }}>
					<Typography
						sx={{
							fontSize: 13,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: "0.12em",
							color: "rgba(255,255,255,0.75)",
						}}
					>
						{t("pages.auth.brandPanel.eyebrow")}
					</Typography>
					<Typography
						sx={{
							fontSize: 44,
							fontWeight: 400,
							lineHeight: 1.1,
							letterSpacing: "-0.02em",
							maxWidth: 460,
						}}
					>
						{t("pages.auth.brandPanel.tagline")}
					</Typography>
					<Typography
						sx={{
							fontSize: 17,
							lineHeight: 1.5,
							color: "rgba(255,255,255,0.75)",
							maxWidth: 460,
						}}
					>
						{t("pages.auth.brandPanel.description")}
					</Typography>
				</Stack>
				<Typography
					sx={{
						position: "relative",
						zIndex: 1,
						color: "rgba(255,255,255,0.5)",
						fontSize: 12,
					}}
				>
					v{__APP_VERSION__}
				</Typography>
			</Stack>
		</Stack>
	);
};

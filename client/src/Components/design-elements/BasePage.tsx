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

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Typography } from "@mui/material";

export const PageSpeedKeyPriorityFallback = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isDark = theme.palette.mode === "dark";
	const alertBg = isDark ? "rgba(245, 158, 11, 0.08)" : "#FFFAEB";
	const alertBorder = isDark ? "rgba(245, 158, 11, 0.45)" : "#F59E0B";
	const alertIcon = isDark ? "#FBBF24" : "#F59E0B";
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
	...props
}: BaseAuthPageProps) => {
	const theme = useTheme();
	return (
		<BasePage
			breadcrumbOverride={[]}
			gap={theme.spacing(LAYOUT.MD)}
			alignItems={"center"}
			justifyContent={"center"}
			minHeight="100vh"
			position={"relative"}
			{...props}
		>
			<HeaderAuthControls
				hideLogo
				py={theme.spacing(LAYOUT.XS)}
				position={"absolute"}
				top={0}
				left={0}
			/>
			<Box width={{ xs: 60, sm: 70, md: 80 }}>
				<Logo
					width={"100%"}
					height={"100%"}
				/>
			</Box>
			<Stack alignItems={"center"}>
				<Typography
					variant="h1"
					mb={theme.spacing(SPACING.LG)}
				>
					{title}
				</Typography>
				<Typography variant="h2">{subtitle}</Typography>
			</Stack>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				width="100%"
				maxWidth={400}
				px={theme.spacing(LAYOUT.MD)}
			>
				{children}
			</Stack>
		</BasePage>
	);
};

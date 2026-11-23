import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import { LAYOUT } from "@/Utils/Theme/constants";
import {
	ErrorFallback,
	EmptyFallback,
	EmptyMonitorFallback,
} from "@/Components/design-elements/Fallback";
import { EmptyState } from "@/Components/design-elements/EmptyState";
import { NoticeBanner } from "@/Components/design-elements/NoticeBanner";
import { Breadcrumb } from "@/Components/design-elements/Breadcrumb";
import { PageHeader } from "@/Components/design-elements/PageHeader";
import CircularProgress from "@mui/material/CircularProgress";

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { fontWeights } from "@/Utils/Theme/Palette";

export const PageSpeedKeyPriorityFallback = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<EmptyState
			fullscreen
			title={t("pages.pageSpeed.fallback.title")}
			description={t("pages.pageSpeed.fallback.description")}
			alert={
				<NoticeBanner severity="warning">
					<Trans
						i18nKey="common.alerts.pageSpeedApiKey.content"
						components={{
							settingsLink: (
								<Link
									component={RouterLink}
									to="/settings"
									color={theme.palette.primary.main}
									fontWeight={fontWeights.semibold}
									sx={{
										textDecoration: "underline",
									}}
								/>
							),
						}}
					/>
				</NoticeBanner>
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
	showActionButton?: boolean;
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
	showActionButton,
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
				showActionButton={showActionButton}
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
	showActionButton?: boolean;
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
	showActionButton,
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
				showActionButton={showActionButton}
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

import Logo from "@/assets/icons/checkmate-icon.svg?react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import {
	ErrorFallback,
	EmptyFallback,
	EmptyMonitorFallback,
	BaseFallback,
} from "@/Components/v2/design-elements/Fallback";
import { Breadcrumb } from "@/Components/v2/design-elements/Breadcrumb";
import CircularProgress from "@mui/material/CircularProgress";
import { HeaderAuthControls } from "@/Pages/Auth/components/HeaderAuthControls";

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Typography } from "@mui/material";

export const PageSpeedKeyPriorityFallback = () => {
	return (
		<BaseFallback>
			<Alert
				severity="warning"
				sx={{
					width: "100%",
					maxWidth: 600,
				}}
			>
				<Typography>
					<Trans
						i18nKey="common.alerts.pageSpeedApiKey.content"
						components={{
							settingsLink: (
								<Link
									component={RouterLink}
									to="/settings"
									color="inherit"
									fontWeight="inherit"
								/>
							),
						}}
					/>
				</Typography>
			</Alert>
		</BaseFallback>
	);
};

interface BasePageProps extends StackProps {
	loading?: boolean;
	error?: boolean;
	children: React.ReactNode;
	breadcrumbOverride?: string[];
}

export const BasePage = ({
	loading,
	error,
	children,
	breadcrumbOverride,
	...props
}: BasePageProps) => {
	const theme = useTheme();

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
			spacing={theme.spacing(10)}
			{...props}
		>
			<Breadcrumb breadcrumbOverride={breadcrumbOverride} />
			{children}
		</Stack>
	);
};

interface BasePageWithStatesProps extends StackProps {
	loading: boolean;
	error: any;
	totalCount: number;
	bullets: string[] | unknown;
	page: string;
	actionButtonText: string;
	actionLink: string;
	children: React.ReactNode;
}

export const BasePageWithStates = ({
	loading,
	error,
	totalCount,
	page,
	bullets,
	actionButtonText,
	actionLink,
	children,
	...props
}: BasePageWithStatesProps) => {
	const showLoading = loading && totalCount === 0;

	if (!loading && totalCount === 0) {
		return (
			<EmptyFallback
				bullets={bullets}
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
}

export const MonitorBasePageWithStates = ({
	loading,
	error,
	totalCount,
	page,
	actionLink,
	children,
	priorityFallback,
	...props
}: MonitorBasePageWithStatesProps) => {
	const { t } = useTranslation();

	const showLoading = loading && totalCount === 0;

	if (priorityFallback) {
		return (
			<BasePage
				loading={loading}
				error={error}
				{...props}
			>
				{priorityFallback}
			</BasePage>
		);
	}

	if (!loading && totalCount === 0) {
		return (
			<EmptyMonitorFallback
				page={page}
				title={t(`pages.${page}.fallback.title`)}
				bullets={t(`pages.${page}.fallback.checks`, { returnObjects: true })}
				actionButtonText={t(`pages.${page}.fallback.actionButton`)}
				actionLink={actionLink || ""}
			/>
		);
	}

	return (
		<BasePage
			loading={showLoading}
			error={error}
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
			gap={theme.spacing(8)}
			alignItems={"center"}
			justifyContent={"center"}
			minHeight="100vh"
			position={"relative"}
			{...props}
		>
			<HeaderAuthControls
				hideLogo
				py={theme.spacing(4)}
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
					mb={theme.spacing(2)}
				>
					{title}
				</Typography>
				<Typography variant="h2">{subtitle}</Typography>
			</Stack>
			<Stack
				gap={theme.spacing(8)}
				width={{
					xs: "80%",
					md: "25%",
					lg: "15%",
				}}
			>
				{children}
			</Stack>
		</BasePage>
	);
};

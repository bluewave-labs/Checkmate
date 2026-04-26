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
import CircularProgress from "@mui/material/CircularProgress";
import { HeaderAuthControls } from "@/Pages/Auth/components/HeaderAuthControls";

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Typography } from "@mui/material";

export const PageSpeedKeyPriorityFallback = () => {
	const theme = useTheme();
	return (
		<EmptyState
			title="PageSpeed monitor needs an API key"
			alert={
				<Stack
					direction="row"
					alignItems="flex-start"
					gap={theme.spacing(LAYOUT.SM)}
					sx={{
						width: "100%",
						p: theme.spacing(LAYOUT.MD),
						borderRadius: 1,
						border: `1px solid ${theme.palette.warning.main}`,
						backgroundColor: theme.palette.warning.light,
						textAlign: "left",
					}}
				>
					<Box
						component="span"
						sx={{
							color: theme.palette.warning.dark,
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
			spacing={theme.spacing(LAYOUT.LG)}
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
				<Stack height={"100%"}>{priorityFallback}</Stack>
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

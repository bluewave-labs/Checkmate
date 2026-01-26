import Stack from "@mui/material/Stack";
import {
	ErrorFallback,
	EmptyFallback,
	EmptyMonitorFallback,
} from "@/Components/v2/design-elements/Fallback";
import { Breadcrumb } from "@/Components/v2/design-elements/Breadcrumb";
import CircularProgress from "@mui/material/CircularProgress";

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
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
			<Breadcrumb />
			{children}
		</Stack>
	);
};

interface BasePageWithStatesProps extends StackProps {
	loading: boolean;
	error: any;
	items: any[];
	bullets: string[] | unknown;
	page: string;
	actionButtonText: string;
	actionLink: string;
	children: React.ReactNode;
}

export const BasePageWithStates = ({
	loading,
	error,
	items,
	page,
	bullets,
	actionButtonText,
	actionLink,
	children,
	...props
}: BasePageWithStatesProps) => {
	const showLoading = loading && (!items || items.length === 0);

	if (isEmpty(items)) {
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
	items: any[];
	page: string;
	actionLink?: string;
	children: React.ReactNode;
}

const isEmpty = (items: any[]) => {
	if (!items) return true;
	if (Array.isArray(items) && items.length === 0) return true;
	return false;
};

export const MonitorBasePageWithStates = ({
	loading,
	error,
	items,
	page,
	actionLink,
	children,
	...props
}: MonitorBasePageWithStatesProps) => {
	const { t } = useTranslation();

	const showLoading = loading && (!items || items.length === 0);

	if (!loading && isEmpty(items)) {
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

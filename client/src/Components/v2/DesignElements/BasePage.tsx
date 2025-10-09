import Stack from "@mui/material/Stack";
import { ErrorFallback, EmptyFallback } from "./Fallback";

import type { StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
interface BasePageProps extends StackProps {
	children: React.ReactNode;
}

export const BasePage: React.FC<BasePageProps> = ({
	children,
	...props
}: {
	children: React.ReactNode;
}) => {
	const theme = useTheme();
	return (
		<Stack
			spacing={theme.spacing(10)}
			{...props}
		>
			{children}
		</Stack>
	);
};

interface BasePageWithStatesProps extends StackProps {
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

export const BasePageWithStates: React.FC<BasePageWithStatesProps> = ({
	loading,
	error,
	items,
	page,
	actionLink,
	children,
	...props
}: BasePageWithStatesProps) => {
	const { t } = useTranslation();

	if (loading) {
		return null;
	}

	if (error) {
		return (
			<ErrorFallback
				title="Something went wrong..."
				subtitle="Please try again later"
			/>
		);
	}

	if (isEmpty(items)) {
		return (
			<EmptyFallback
				page={page}
				title={t(`${page}Monitor.fallback.title`)}
				bullets={t(`${page}Monitor.fallback.checks`, { returnObjects: true })}
				actionButtonText={t(`${page}Monitor.fallback.actionButton`)}
				actionLink={actionLink || ""}
			/>
		);
	}

	return <BasePage {...props}>{children}</BasePage>;
};

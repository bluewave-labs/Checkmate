import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { EmptyState } from "./EmptyState";

import type { StackProps } from "@mui/material/Stack";

interface BaseFallbackProps extends StackProps {
	children: React.ReactNode;
}

export const BaseFallback = ({ children, ...props }: BaseFallbackProps) => {
	const theme = useTheme();
	return (
		<Stack
			alignItems="center"
			justifyContent="center"
			sx={{ width: "100%", py: theme.spacing(LAYOUT.LG) }}
			{...props}
		>
			{children}
		</Stack>
	);
};

export const ErrorFallback = ({
	title,
	subtitle,
}: {
	title: string;
	subtitle: string;
}) => {
	return (
		<EmptyState
			fullscreen
			title={title}
			description={subtitle}
		/>
	);
};

export const EmptyFallback = ({
	title,
	description,
	actionButtonText,
	actionLink,
}: {
	title: string;
	description?: string;
	actionButtonText: string;
	actionLink: string;
}) => {
	return (
		<EmptyState
			fullscreen
			title={title}
			description={description}
			actionText={actionButtonText}
			actionTo={actionLink}
		/>
	);
};

export const EmptyMonitorFallback = ({
	title,
	description,
	actionButtonText,
	actionLink,
}: {
	page: string;
	title: string;
	description?: string;
	actionButtonText: string;
	actionLink: string;
}) => {
	return (
		<EmptyState
			fullscreen
			title={title}
			description={description}
			actionText={actionButtonText}
			actionTo={actionLink}
		/>
	);
};

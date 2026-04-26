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
			title={title}
			description={subtitle}
		/>
	);
};

const bulletsToDescription = (bullets: unknown): string | undefined => {
	if (!Array.isArray(bullets) || bullets.length === 0) return undefined;
	return bullets.join(" • ");
};

export const EmptyFallback = ({
	title,
	bullets,
	actionButtonText,
	actionLink,
}: {
	title: string;
	bullets: unknown;
	actionButtonText: string;
	actionLink: string;
}) => {
	return (
		<EmptyState
			title={title}
			description={bulletsToDescription(bullets)}
			actionText={actionButtonText}
			actionTo={actionLink}
		/>
	);
};

export const EmptyMonitorFallback = ({
	title,
	bullets,
	actionButtonText,
	actionLink,
}: {
	page: string;
	title: string;
	bullets: unknown;
	actionButtonText: string;
	actionLink: string;
}) => {
	return (
		<EmptyState
			title={title}
			description={bulletsToDescription(bullets)}
			actionText={actionButtonText}
			actionTo={actionLink}
		/>
	);
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { EmptyStateIllustration } from "./EmptyStateIllustration";

import type { ReactNode } from "react";

interface EmptyStateProps {
	title: string;
	description?: ReactNode;
	actionText?: string;
	actionTo?: string;
	onAction?: () => void;
	secondaryText?: string;
	secondaryHref?: string;
	compact?: boolean;
	fullscreen?: boolean;
	alert?: ReactNode;
	children?: ReactNode;
}

export const EmptyState = ({
	title,
	description,
	actionText,
	actionTo,
	onAction,
	secondaryText,
	secondaryHref,
	compact = false,
	fullscreen = false,
	alert,
	children,
}: EmptyStateProps) => {
	const theme = useTheme();

	if (compact) {
		return (
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(LAYOUT.MD)}
				sx={{ py: theme.spacing(LAYOUT.MD), px: theme.spacing(LAYOUT.SM) }}
			>
				<EmptyStateIllustration
					width={80}
					height={60}
				/>
				<Stack sx={{ flex: 1 }}>
					<Typography
						sx={{
							fontSize: 15,
							fontWeight: 600,
							color: theme.palette.text.primary,
						}}
					>
						{title}
					</Typography>
					{description && (
						<Typography
							sx={{
								fontSize: 13,
								color: theme.palette.text.secondary,
								lineHeight: 1.55,
							}}
						>
							{description}
						</Typography>
					)}
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack
			alignItems="center"
			justifyContent="center"
			sx={{
				...(fullscreen && { minHeight: "65vh" }),
				py: theme.spacing(LAYOUT.XXL),
				px: theme.spacing(LAYOUT.MD),
				textAlign: "center",
			}}
		>
			<EmptyStateIllustration />
			<Typography
				sx={{
					mt: theme.spacing(LAYOUT.MD),
					mb: theme.spacing(LAYOUT.XS),
					fontSize: 16,
					fontWeight: 600,
					color: theme.palette.text.primary,
				}}
			>
				{title}
			</Typography>
			{description && (
				<Typography
					sx={{
						maxWidth: 360,
						fontSize: 13,
						color: theme.palette.text.secondary,
						lineHeight: 1.55,
						mb: theme.spacing(LAYOUT.LG),
					}}
				>
					{description}
				</Typography>
			)}
			{alert && (
				<Stack sx={{ width: "100%", maxWidth: 520, mb: theme.spacing(LAYOUT.MD) }}>
					{alert}
				</Stack>
			)}
			{(actionText || secondaryText) && (
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.MD)}
				>
					{actionText && (actionTo || onAction) && (
						<Button
							variant="contained"
							color="primary"
							{...(actionTo
								? { component: RouterLink, to: actionTo }
								: { onClick: onAction })}
						>
							{actionText}
						</Button>
					)}
					{secondaryText && secondaryHref && (
						<Typography
							component="a"
							href={secondaryHref}
							target="_blank"
							rel="noopener"
							sx={{
								fontSize: 13,
								fontWeight: 500,
								color: theme.palette.primary.main,
								textDecoration: "none",
								"&:hover": { textDecoration: "underline" },
							}}
						>
							{secondaryText} →
						</Typography>
					)}
				</Stack>
			)}
			{children}
		</Stack>
	);
};

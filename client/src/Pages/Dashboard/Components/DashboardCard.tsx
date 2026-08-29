import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { BaseBox } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useCardSlot } from "./CardSlotContext";

import type { ReactNode } from "react";

// Matches the 34px control height plus the header's vertical padding, so a card
// with no action still lines up with one that has a button in its header.
const HEADER_MIN_HEIGHT = 44;
const SKELETON_ROW_HEIGHT = 20;

interface DashboardCardProps {
	title: string;
	/** Where the title links to — the page this card belongs to. */
	to?: string;
	/** Rendered at the right of the header: a count, an average, a filter. */
	action?: ReactNode;
	isLoading?: boolean;
	error?: unknown;
	/** Dimmed rather than blanked while a refresh is in flight over stale data. */
	isStale?: boolean;
	children: ReactNode;
}

export const DashboardCard = ({
	title,
	to,
	action,
	isLoading,
	error,
	isStale,
	children,
}: DashboardCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const slot = useCardSlot();

	return (
		<BaseBox
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden",
				// The header controls stay invisible until the card is hovered or
				// something inside it takes focus, so a settled dashboard is quiet.
				"&:hover .dashboard-card-slot, &:focus-within .dashboard-card-slot": {
					opacity: 1,
					pointerEvents: "auto",
				},
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				gap={theme.spacing(LAYOUT.SM)}
				px={theme.spacing(LAYOUT.MD)}
				py={theme.spacing(LAYOUT.SM)}
				borderBottom={`1px solid ${theme.palette.divider}`}
				minHeight={HEADER_MIN_HEIGHT}
			>
				<Typography
					{...(to ? { component: RouterLink, to } : {})}
					fontSize={typographyLevels.m}
					fontWeight={500}
					color={theme.palette.text.primary}
					sx={{
						textDecoration: "none",
						...(to && {
							"&:hover": { color: theme.palette.primary.main },
						}),
					}}
				>
					{title}
				</Typography>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.SM)}
					flexShrink={0}
				>
					{isStale && (
						<CircularProgress
							size={16}
							color="primary"
						/>
					)}
					{action}
					{slot && (
						<Box
							className="dashboard-card-slot"
							sx={{
								opacity: 0,
								pointerEvents: "none",
								transition: "opacity 0.15s ease",
							}}
						>
							{slot}
						</Box>
					)}
				</Stack>
			</Stack>
			<Box
				flex={1}
				p={theme.spacing(LAYOUT.MD)}
				sx={{
					...(isStale && { opacity: 0.5, transition: "opacity 0.2s ease" }),
				}}
			>
				{isLoading ? (
					<CardSkeleton />
				) : error ? (
					<CardMessage text={t("pages.dashboard.card.error")} />
				) : (
					children
				)}
			</Box>
		</BaseBox>
	);
};

/** Placeholder rows, sized to the row list most cards render. */
export const CardSkeleton = ({ rows = 3 }: { rows?: number }) => {
	const theme = useTheme();
	return (
		<Stack gap={theme.spacing(LAYOUT.SM)}>
			{Array.from({ length: rows }).map((_, index) => (
				<Skeleton
					key={index}
					variant="rounded"
					height={SKELETON_ROW_HEIGHT}
					width={index === rows - 1 ? "60%" : "100%"}
				/>
			))}
		</Stack>
	);
};

/** The quiet one-line state a healthy card collapses to. */
export const CardMessage = ({ text, action }: { text: string; action?: ReactNode }) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			gap={theme.spacing(LAYOUT.SM)}
		>
			<Typography
				fontSize={typographyLevels.s}
				color={theme.palette.text.secondary}
			>
				{text}
			</Typography>
			{action}
		</Stack>
	);
};

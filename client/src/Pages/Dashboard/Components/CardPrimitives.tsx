import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

import type { ReactNode } from "react";

/** Thin enough to read as a proportion indicator, not a progress bar. */
const BAR_HEIGHT = 4;

/**
 * A proportional bar. `value` and `max` share whatever unit the caller uses;
 * percentages come in as 0-100, not as the API's 0-1 fractions.
 */
export const CardBar = ({
	value,
	max = 100,
	color,
}: {
	value: number;
	max?: number;
	color: string;
}) => {
	const theme = useTheme();
	const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;

	return (
		<Box
			width="100%"
			height={BAR_HEIGHT}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.action.hover}
			sx={{ overflow: "hidden" }}
		>
			<Box
				width={`${ratio * 100}%`}
				height="100%"
				bgcolor={color}
				sx={{ transition: "width 0.3s ease" }}
			/>
		</Box>
	);
};

/** A clickable list row. Rows link to the entity they describe. */
export const CardRow = ({ to, children }: { to?: string; children: ReactNode }) => {
	const theme = useTheme();

	return (
		<Stack
			{...(to ? { component: RouterLink, to } : {})}
			direction="row"
			alignItems="center"
			gap={theme.spacing(LAYOUT.SM)}
			px={theme.spacing(LAYOUT.XS)}
			py={theme.spacing(LAYOUT.XS)}
			mx={`-${theme.spacing(LAYOUT.XS)}`}
			borderRadius={theme.shape.borderRadius}
			color="inherit"
			sx={{
				textDecoration: "none",
				...(to && {
					"&:hover": { backgroundColor: theme.palette.action.hover },
				}),
			}}
		>
			{children}
		</Stack>
	);
};

/** Name plus optional secondary line, truncating rather than wrapping. */
export const CardRowLabel = ({
	primary,
	secondary,
}: {
	primary: string;
	secondary?: string | null;
}) => {
	const theme = useTheme();

	return (
		<Stack
			minWidth={0}
			flex={1}
		>
			<Typography
				fontSize={typographyLevels.m}
				color={theme.palette.text.primary}
				noWrap
			>
				{primary}
			</Typography>
			{secondary && (
				<Typography
					fontSize={typographyLevels.s}
					color={theme.palette.text.secondary}
					noWrap
				>
					{secondary}
				</Typography>
			)}
		</Stack>
	);
};

/** A single large figure with a caption — the shape of the stat cards. */
export const CardFigure = ({
	value,
	caption,
	color,
}: {
	value: string;
	caption?: string;
	color?: string;
}) => {
	const theme = useTheme();

	return (
		<Stack gap={theme.spacing(LAYOUT.XXS)}>
			<Typography
				fontSize={typographyLevels.xxl}
				fontWeight={300}
				color={color ?? theme.palette.text.primary}
				lineHeight={1.1}
			>
				{value}
			</Typography>
			{caption && (
				<Typography
					fontSize={typographyLevels.s}
					color={theme.palette.text.secondary}
				>
					{caption}
				</Typography>
			)}
		</Stack>
	);
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { typographyLevels, toSignalKey } from "@/Utils/Theme/Palette";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import { BaseBox, TooltipWithInfo } from "@/Components/design-elements";
import type { SxProps } from "@mui/material";
import { FONT_WEIGHT, LINE_HEIGHT } from "@/Utils/Theme/constants";

type GradientBox = React.PropsWithChildren<{
	palette?: PaletteKey;
	sx?: SxProps;
	interactive?: boolean;
}>;

// Kept the GradientBox name for its callers; the VerifyWise look is flat, so
// the card is plain paper and a status colour moves to the value text instead.
export const GradientBox = ({ children, sx, interactive }: GradientBox) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<BaseBox
			sx={{
				padding: `${theme.spacing(6)} ${theme.spacing(8)}`,
				width: isSmall ? `100%` : `calc(25% - (3 * ${theme.spacing(8)} / 4))`,
				backgroundColor: theme.palette.background.paper,
				...(interactive && {
					cursor: "pointer",
					"&:hover": {
						backgroundColor: theme.palette.action.rowHover,
						borderColor: theme.palette.neutral.border,
					},
				}),
				...sx,
			}}
		>
			{children}
		</BaseBox>
	);
};

type StatBoxProps = React.PropsWithChildren<{
	title: string;
	subtitle: string;
	palette?: PaletteKey;
	sx?: SxProps;
	tooltip?: string;
	onClick?: () => void;
}>;

export const StatBox = ({
	title,
	subtitle,
	palette,
	children,
	sx,
	tooltip,
	onClick,
}: StatBoxProps) => {
	const theme = useTheme();
	// Colour the value only when it is a status (e.g. up / down)
	const valueColor = palette ? theme.palette[palette].dark : theme.palette.text.primary;
	// A status with no value (e.g. "Service is down") is a status banner: signal tint,
	// border and text, so it still stands out without a number to colour
	const bannerTone =
		palette && !subtitle ? theme.palette.signal[toSignalKey(palette)] : null;

	return (
		<GradientBox
			palette={palette}
			interactive={Boolean(onClick)}
			sx={{
				...(bannerTone && {
					backgroundColor: bannerTone.bg,
					borderColor: bannerTone.border,
				}),
				...(sx as object),
			}}
		>
			<Stack
				onClick={onClick}
				gap={theme.spacing(2)}
			>
				<Box
					display="flex"
					alignItems="center"
					gap={theme.spacing(2)}
				>
					<Typography
						variant="eyebrow"
						color={bannerTone ? bannerTone.text : theme.palette.neutral.tertiary}
					>
						{title}
					</Typography>
					{tooltip && (
						<TooltipWithInfo
							title={tooltip}
							iconColor={theme.palette.neutral.icon}
							iconSize={14}
						/>
					)}
				</Box>
				{subtitle && (
					<Typography
						color={valueColor}
						fontSize={typographyLevels.xl}
						fontWeight={FONT_WEIGHT.SEMIBOLD}
						lineHeight={LINE_HEIGHT.HEADING}
						sx={{ fontVariantNumeric: "tabular-nums" }}
					>
						{subtitle}
					</Typography>
				)}
				{children}
			</Stack>
		</GradientBox>
	);
};

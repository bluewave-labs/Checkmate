import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { typographyLevels, toSignalKey } from "@/Utils/Theme/Palette";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import { BaseBox, TooltipWithInfo } from "@/Components/design-elements";
import type { SxProps } from "@mui/material";
import { FONT_WEIGHT, LAYOUT, LINE_HEIGHT } from "@/Utils/Theme/constants";

type GradientBox = React.PropsWithChildren<{
	palette?: PaletteKey;
	sx?: SxProps;
	interactive?: boolean;
}>;

// Name kept for existing callers; the card itself is flat
export const GradientBox = ({ children, sx, interactive }: GradientBox) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<BaseBox
			sx={{
				padding: `${theme.spacing(LAYOUT.SM)} ${theme.spacing(LAYOUT.MD)}`,
				width: isSmall ? `100%` : `calc(25% - (3 * ${theme.spacing(LAYOUT.MD)} / 4))`,
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
	const valueColor = palette ? theme.palette[palette].dark : theme.palette.text.primary;
	// A status with no value renders as a tinted banner
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
				gap={theme.spacing(LAYOUT.XXS)}
			>
				<Box
					display="flex"
					alignItems="center"
					gap={theme.spacing(LAYOUT.XXS)}
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

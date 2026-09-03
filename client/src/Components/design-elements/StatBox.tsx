import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { darken, lighten } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import { BaseBox, TooltipWithInfo } from "@/Components/design-elements";
import type { SxProps } from "@mui/material";

type GradientBox = React.PropsWithChildren<{
	palette?: PaletteKey;
	sx?: SxProps;
	interactive?: boolean;
}>;

export const GradientBox = ({ children, palette, sx, interactive }: GradientBox) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isLight = theme.palette.mode === "light";
	const paper = theme.palette.background.paper;
	// In light mode `paper` is white, and lightening white is a no-op - the
	// gradient collapses flat. Darken slightly towards the page ground instead.
	const paperStart = isLight ? darken(paper, 0.02) : lighten(paper, 0.08);
	const paperEnd = paper;
	const bg = palette
		? `linear-gradient(135deg, ${theme.palette[palette].light} 0%, ${theme.palette[palette].main} 100%)`
		: `linear-gradient(135deg, ${paperStart} 0%, ${paperEnd} 100%)`;

	return (
		<BaseBox
			sx={{
				padding: `${theme.spacing(4)} ${theme.spacing(8)}`,
				width: isSmall ? `100%` : `calc(25% - (3 * ${theme.spacing(8)} / 4))`,
				background: bg,
				...(interactive && {
					cursor: "pointer",
					"&:hover": {
						backgroundImage: `linear-gradient(${theme.palette.action.rowHover}, ${theme.palette.action.rowHover}), ${bg}`,
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
	const textColor = palette ? theme.palette[palette].contrastText : "inherit";

	return (
		<GradientBox
			palette={palette}
			interactive={Boolean(onClick)}
			sx={{ ...(sx as object) }}
		>
			<Stack onClick={onClick}>
				<Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
					<Typography
						variant="eyebrow"
						color={palette ? textColor : "text.secondary"}
					>
						{title}
					</Typography>
					{tooltip && (
						<TooltipWithInfo
							title={tooltip}
							iconColor={textColor as string}
							iconSize={14}
						/>
					)}
				</Box>
				<Typography color={textColor}>{subtitle}</Typography>
				{children}
			</Stack>
		</GradientBox>
	);
};

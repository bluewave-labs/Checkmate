import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { lighten } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import { BaseBox, TooltipWithInfo } from "@/Components/design-elements";
import type { SxProps } from "@mui/material";

type GradientBox = React.PropsWithChildren<{
	palette?: PaletteKey;
	sx?: SxProps;
}>;

export const GradientBox = ({ children, palette, sx }: GradientBox) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isLight = theme.palette.mode === "light";
	const paper = theme.palette.background.paper;
	const paperStart = lighten(paper, isLight ? 0.06 : 0.08);
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
			sx={{
				...(sx as object),
				...(onClick ? { cursor: "pointer", "&:hover": { opacity: 0.95 } } : {}),
			}}
		>
			<Stack onClick={onClick}>
				<Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
					<Typography color={textColor}>{title}</Typography>
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

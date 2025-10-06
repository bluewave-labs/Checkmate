import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import type { PaletteKey } from "@/Utils/Theme/v2/theme";

type GradientBox = React.PropsWithChildren<{ palette?: PaletteKey }>;

export const GradientBox: React.FC<GradientBox> = ({ children, palette }) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const bg = palette
		? `linear-gradient(to bottom right, ${theme.palette[palette].main} 30%, ${theme.palette[palette].lowContrast} 70%)`
		: `linear-gradient(340deg, ${theme.palette.tertiary.main} 10%, ${theme.palette.primary.main} 45%)`;

	return (
		<Box
			border={1}
			sx={{
				padding: `${theme.spacing(4)} ${theme.spacing(8)}`,
				width: isSmall
					? `calc(50% - (1 * ${theme.spacing(8)} / 2))`
					: `calc(25% - (3 * ${theme.spacing(8)} / 4))`,

				borderStyle: "solid",
				borderRadius: 4,
				borderColor: theme.palette.primary.lowContrast,
				background: bg,
			}}
		>
			{children}
		</Box>
	);
};

type StatBoxProps = React.PropsWithChildren<{
	title: string;
	subtitle: string;
	palette?: PaletteKey;
}>;

export const StatBox: React.FC<StatBoxProps> = ({
	title,
	subtitle,
	palette,
	children,
}) => {
	const theme = useTheme();
	const textColor = palette ? theme.palette[palette].contrastText : "inherit";

	return (
		<GradientBox palette={palette}>
			<Stack>
				<Typography color={textColor}>{title}</Typography>
				<Typography color={textColor}>{subtitle}</Typography>
				{children}
			</Stack>
		</GradientBox>
	);
};

import { BaseBox } from ".";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { ResponsiveStyleValue } from "@mui/system";

import { useTheme } from "@mui/material/styles";

type BaseChartProps = React.PropsWithChildren<{
	icon?: React.ReactNode;
	title: string;
	width?: number | string;
	maxWidth?: number | string;
	flexBasis?: number | string;
	padding?: number | string | ResponsiveStyleValue<number | string>;
	onClick?: () => void;
}>;

export const BaseChart = ({
	children,
	title,
	width = "100%",
	maxWidth = "100%",
	flexBasis = "0%",
	padding,
	onClick,
}: BaseChartProps) => {
	const theme = useTheme();
	return (
		<BaseBox
			onClick={onClick}
			sx={{
				padding: padding ?? theme.spacing(LAYOUT.MD),
				display: "flex",
				flex: 1,
				flexBasis,
				width: width,
				maxWidth: maxWidth,
				...(onClick && {
					cursor: "pointer",
					"& .recharts-wrapper": { cursor: "pointer !important" },
				}),
			}}
		>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				flex={1}
			>
				<Typography
					variant="eyebrow"
					color="text.secondary"
					sx={{ overflowWrap: "anywhere" }}
				>
					{title}
				</Typography>
				<Box flex={1}>{children}</Box>
			</Stack>
		</BaseBox>
	);
};

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
	padding?: number | string | ResponsiveStyleValue<number | string>;
}>;

export const BaseChart = ({
	children,
	title,
	width = "100%",
	maxWidth = "100%",
	padding,
}: BaseChartProps) => {
	const theme = useTheme();
	return (
		<BaseBox
			sx={{
				padding: padding ?? theme.spacing(LAYOUT.MD),
				display: "flex",
				flex: 1,
				width: width,
				maxWidth: maxWidth,
			}}
		>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				flex={1}
			>
				<Typography
					variant="eyebrow"
					color="text.secondary"
				>
					{title}
				</Typography>
				<Box flex={1}>{children}</Box>
			</Stack>
		</BaseBox>
	);
};

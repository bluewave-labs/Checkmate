import { BaseBox } from "../design-elements";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ResponsiveStyleValue } from "@mui/system";

import { useTheme } from "@mui/material/styles";

type BaseChartProps = React.PropsWithChildren<{
	icon: React.ReactNode;
	title: string;
	width?: number | string;
	maxWidth?: number | string;
	padding?: number | string | ResponsiveStyleValue<number | string>;
}>;

export const BaseChart = ({
	children,
	icon,
	title,
	width = "100%",
	maxWidth = "100%",
	padding,
}: BaseChartProps) => {
	const theme = useTheme();
	return (
		<BaseBox
			sx={{
				padding: padding ?? theme.spacing(8),
				display: "flex",
				flex: 1,
				width: width,
				maxWidth: maxWidth,
			}}
		>
			<Stack
				gap={theme.spacing(8)}
				flex={1}
			>
				<Stack
					direction="row"
					alignItems={"center"}
					gap={theme.spacing(4)}
				>
					{icon && (
						<BaseBox
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: 34,
								height: 34,
								backgroundColor: theme.palette.action.hover,
								"& svg": {
									width: 20,
									height: 20,
									"& path": {
										stroke: theme.palette.text.secondary,
									},
								},
							}}
						>
							{icon}
						</BaseBox>
					)}
					<Typography variant="h2">{title}</Typography>
				</Stack>
				<Box flex={1}>{children}</Box>
			</Stack>
		</BaseBox>
	);
};

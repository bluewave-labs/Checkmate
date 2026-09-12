import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface DashboardCardProps {
	title: string;
	topRight?: React.ReactNode;
	children: React.ReactNode;
}

export const DashboardCard = ({ title, topRight, children }: DashboardCardProps) => {
	const theme = useTheme();

	return (
		<Box
			bgcolor={theme.palette.background.paper}
			border={1}
			borderColor={theme.palette.divider}
			borderRadius={`${theme.shape.borderRadius}px`}
			padding={theme.spacing(LAYOUT.MD)}
			display="flex"
			flexDirection="column"
			gap={theme.spacing(LAYOUT.SM)}
			height="100%"
			boxSizing="border-box"
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
			>
				<Typography
					fontSize={typographyLevels.m}
					fontWeight={500}
					color={theme.palette.text.primary}
				>
					{title}
				</Typography>
				{topRight && (
					<Typography
						fontSize={typographyLevels.s}
						color={theme.palette.text.secondary}
					>
						{topRight}
					</Typography>
				)}
			</Stack>
			{children}
		</Box>
	);
};

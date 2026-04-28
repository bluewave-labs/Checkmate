import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { LAYOUT } from "@/Utils/Theme/constants";
export const SplitBox = ({
	left,
	right,
}: {
	left: React.ReactNode;
	right: React.ReactNode;
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			bgcolor={theme.palette.background.paper}
			border={1}
			borderColor={theme.palette.divider}
			borderRadius={theme.shape.borderRadius}
		>
			<Box
				padding={theme.spacing(LAYOUT.XXL)}
				borderRight={isSmall ? 0 : 1}
				borderBottom={isSmall ? 1 : 0}
				borderColor={theme.palette.divider}
				flex={0.7}
				sx={{
					background:
						theme.palette.mode === "dark"
							? "linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.02) 100%)"
							: "linear-gradient(135deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.02) 100%)",
				}}
			>
				{left}
			</Box>
			<Box
				flex={1}
				padding={theme.spacing(LAYOUT.XXL)}
			>
				{right}
			</Box>
		</Stack>
	);
};

export const ConfigBox = ({
	title,
	subtitle,
	leftContent,
	rightContent,
}: {
	title: string;
	subtitle: React.ReactNode;
	leftContent?: React.ReactNode;
	rightContent: React.ReactNode;
}) => {
	const theme = useTheme();
	return (
		<SplitBox
			left={
				<Stack spacing={theme.spacing(LAYOUT.XS)}>
					<Typography
						component="h2"
						variant="eyebrow"
						color="text.secondary"
					>
						{title}
					</Typography>
					<Typography component="p">{subtitle}</Typography>
					{leftContent}
				</Stack>
			}
			right={rightContent}
		/>
	);
};

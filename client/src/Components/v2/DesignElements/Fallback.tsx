import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import OutputAnimation from "@/assets/Animations/output.gif";
import DarkmodeOutput from "@/assets/Animations/darkmodeOutput.gif";
import Typography from "@mui/material/Typography";
import { BulletPointCheck } from "@/Components/v2/DesignElements";
import { Button } from "@/Components/v2/Inputs";

import { useNavigate } from "react-router";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";

import type { BoxProps } from "@mui/material";

interface BaseFallbackProps extends BoxProps {
	children: React.ReactNode;
}

export const BaseFallback: React.FC<BaseFallbackProps> = ({ children, ...props }) => {
	const theme = useTheme();
	const mode = useSelector((state: any) => state.ui.mode);
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<Box
			margin={isSmall ? "inherit" : "auto"}
			marginTop={isSmall ? "33%" : "auto"}
			width={{
				sm: "90%",
				md: "70%",
				lg: "50%",
				xl: "40%",
			}}
			padding={theme.spacing(16)}
			bgcolor={theme.palette.primary.main}
			position="relative"
			border={1}
			borderColor={theme.palette.primary.lowContrast}
			borderRadius={theme.shape.borderRadius}
			overflow="hidden"
			sx={{
				borderStyle: "dashed",
			}}
			{...props}
		>
			<Stack
				alignItems="center"
				gap={theme.spacing(20)}
				sx={{
					width: "fit-content",
					margin: "auto",
					marginTop: "100px",
				}}
			>
				<Box
					component="img"
					src={mode === "light" ? OutputAnimation : DarkmodeOutput}
					bgcolor="transparent"
					alt="Loading animation"
					width="100%"
					sx={{
						zIndex: 1,
						border: "none",
						borderRadius: theme.spacing(8),
					}}
				/>

				<Stack
					gap={theme.spacing(4)}
					alignItems="center"
					maxWidth={"300px"}
					zIndex={1}
				>
					{children}
				</Stack>
			</Stack>
		</Box>
	);
};

export const ErrorFallback = ({
	title,
	subtitle,
}: {
	title: string;
	subtitle: string;
}) => {
	const theme = useTheme();
	return (
		<BaseFallback>
			<Typography
				variant="h1"
				marginY={theme.spacing(4)}
				color={theme.palette.primary.contrastTextTertiary}
			>
				{title}
			</Typography>
			<Typography>{subtitle}</Typography>
		</BaseFallback>
	);
};

export const EmptyFallback = ({
	page,
	title,
	bullets,
	actionButtonText,
	actionLink,
}: {
	page: string;
	title: string;
	bullets: any;
	actionButtonText: string;
	actionLink: string;
}) => {
	const theme = useTheme();
	const navigate = useNavigate();
	return (
		<BaseFallback>
			<Stack
				gap={theme.spacing(10)}
				zIndex={1}
				alignItems="center"
			>
				<Typography
					component="h1"
					color={theme.palette.primary.contrastText}
				>
					{title}
				</Typography>
				<Stack
					sx={{
						flexWrap: "wrap",
						gap: theme.spacing(2),
						maxWidth: { xs: "90%", md: "80%", lg: "75%" },
					}}
				>
					{bullets?.map((bullet: string, index: number) => (
						<BulletPointCheck
							text={bullet}
							key={`${(page + "Monitors").trim().split(" ")[0]}-${index}`}
						/>
					))}
				</Stack>
				<Stack>
					<Button
						variant="contained"
						color="accent"
						onClick={() => navigate(actionLink)}
					>
						{actionButtonText}
					</Button>
				</Stack>
			</Stack>
		</BaseFallback>
	);
};

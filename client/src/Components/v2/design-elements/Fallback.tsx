import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BulletPointCheck, SkeletonCard } from "@/Components/v2/design-elements";
import { Button } from "@/Components/v2/inputs";

import { useNavigate } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { StackProps } from "@mui/material/Stack";

interface BaseFallbackProps extends StackProps {
	children: React.ReactNode;
}

export const BaseFallback = ({ children, ...props }: BaseFallbackProps) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<Stack
			alignItems={"center"}
			margin={isSmall ? "inherit" : "auto"}
			marginTop={isSmall ? "33%" : "10%"}
			width={{
				sm: "90%",
				md: "70%",
				lg: "50%",
				xl: "40%",
			}}
			padding={{ xs: theme.spacing(8), md: theme.spacing(16) }}
			bgcolor={theme.palette.background.paper}
			border={1}
			borderColor={theme.palette.divider}
			borderRadius={theme.shape.borderRadius}
			sx={{
				borderStyle: "dashed",
			}}
			{...props}
		>
			<SkeletonCard showHalo={true} />
			{children}
		</Stack>
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
				color={theme.palette.text.secondary}
			>
				{title}
			</Typography>
			<Typography>{subtitle}</Typography>
		</BaseFallback>
	);
};

export const EmptyFallback = ({
	title,
	bullets,
	actionButtonText,
	actionLink,
}: {
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
						maxWidth: "1100px",
						width: "100%",
					}}
				>
					{Array.isArray(bullets) &&
						bullets?.map((bullet: string) => (
							<BulletPointCheck
								text={bullet}
								key={`${bullet}-${Math.random()}`}
							/>
						))}
				</Stack>
				<Stack>
					<Button
						variant="contained"
						color="primary"
						onClick={() => navigate(actionLink)}
					>
						{actionButtonText}
					</Button>
				</Stack>
			</Stack>
		</BaseFallback>
	);
};

export const EmptyMonitorFallback = ({
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
						maxWidth: "1100px",
						width: "100%",
					}}
				>
					{Array.isArray(bullets) &&
						bullets?.map((bullet: string, index: number) => (
							<BulletPointCheck
								text={bullet}
								key={`${(page + "Monitors").trim().split(" ")[0]}-${index}`}
							/>
						))}
				</Stack>
			</Stack>
		</BaseFallback>
	);
};

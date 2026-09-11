import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface DashboardCardProps {
	title: string;
	topRight?: React.ReactNode;
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
	children: React.ReactNode;
}

export const DashboardCard = ({
	title,
	topRight,
	isLoading,
	error,
	dragHandleProps,
	children,
}: DashboardCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const renderContent = () => {
		if (isLoading) {
			return (
				<Stack gap={theme.spacing(LAYOUT.XS)}>
					{[80, 60, 90, 50, 70].map((w, i) => (
						<Skeleton
							key={i}
							variant="rounded"
							height={14}
							width={`${w}%`}
						/>
					))}
				</Stack>
			);
		}
		if (error) {
			return (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.error.main}
				>
					{t("pages.dashboard.error")}
				</Typography>
			);
		}
		return children;
	};

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
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.SM)}
				>
					{topRight && (
						<Typography
							fontSize={typographyLevels.s}
							color={theme.palette.text.secondary}
						>
							{topRight}
						</Typography>
					)}
					<Box
						color={theme.palette.text.disabled}
						display="flex"
						alignItems="center"
						{...(dragHandleProps ?? {})}
						sx={{
							cursor: dragHandleProps ? "grab" : "default",
							"&:active": { cursor: dragHandleProps ? "grabbing" : "default" },
							outline: "none",
						}}
					>
						<GripVertical size={LAYOUT.XXL} />
					</Box>
				</Stack>
			</Stack>
			{renderContent()}
		</Box>
	);
};

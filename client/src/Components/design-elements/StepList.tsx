import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import { useTheme } from "@mui/material/styles";
import type { LucideIcon } from "lucide-react";
import { INPUT_BASE_HEIGHT, LAYOUT } from "@/Utils/Theme/constants";
import Icon from "@/Components/design-elements/Icon";
import { typographyLevels, fontWeights } from "@/Utils/Theme/Palette";

const STEP_NUMBER_SIZE = 16;
const STEP_NUMBER_OFFSET = -6;

export interface StepListItem {
	icon: LucideIcon;
	title: string;
	description?: React.ReactNode;
}

const StepTile = ({ icon, number }: { icon: LucideIcon; number: number }) => {
	const theme = useTheme();

	return (
		<Stack
			width={INPUT_BASE_HEIGHT}
			height={INPUT_BASE_HEIGHT}
			position="relative"
			flexShrink={0}
			alignItems={"center"}
			justifyContent={"center"}
			borderRadius={theme.shape.borderRadius}
			border={`1px solid ${theme.palette.neutral.hairline}`}
			bgcolor={theme.palette.neutral.raised}
			color={theme.palette.accent}
		>
			<Icon icon={icon} />
			<Stack
				position="absolute"
				top={STEP_NUMBER_OFFSET}
				right={STEP_NUMBER_OFFSET}
				width={STEP_NUMBER_SIZE}
				height={STEP_NUMBER_SIZE}
				alignItems="center"
				justifyContent="center"
				borderRadius="50%"
				border={`1px solid ${theme.palette.neutral.border}`}
				bgcolor={theme.palette.background.paper}
				color={theme.palette.text.secondary}
				fontSize={typographyLevels.s}
				fontWeight={fontWeights.semibold}
				lineHeight={1}
			>
				{number}
			</Stack>
		</Stack>
	);
};

export const StepList = ({ steps }: { steps: StepListItem[] }) => {
	const theme = useTheme();

	return (
		<List disablePadding>
			{steps.map((step, index) => {
				const isLast = index === steps.length - 1;
				return (
					<ListItem
						key={step.title}
						disableGutters
						disablePadding
						alignItems="flex-start"
						sx={{ gap: LAYOUT.SM }}
					>
						<ListItemIcon
							sx={{
								minWidth: 0,
								mt: 0,
								flexDirection: "column",
								alignItems: "center",
								alignSelf: "stretch",
							}}
						>
							<StepTile
								icon={step.icon}
								number={index + 1}
							/>
							{!isLast && (
								<Box
									flex={1}
									borderLeft={`1px solid ${theme.palette.neutral.hairline}`}
								/>
							)}
						</ListItemIcon>
						<ListItemText
							primary={step.title}
							secondary={step.description}
							slotProps={{
								primary: {
									fontWeight: fontWeights.semibold,
									color: theme.palette.text.primary,
								},
								secondary: { variant: "body1", color: theme.palette.text.secondary },
							}}
							sx={{ mt: 0, mb: isLast ? 0 : LAYOUT.MD, minHeight: INPUT_BASE_HEIGHT }}
						/>
					</ListItem>
				);
			})}
		</List>
	);
};

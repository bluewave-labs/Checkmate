import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { CloudCheck, Laptop, Lock, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TILE_SIZE = 56;
const ICON_SIZE = 26;
const CONNECTOR_WIDTH = 64;
const BADGE_SIZE = 22;
const BADGE_ICON_SIZE = 12;
const STROKE_WIDTH = 1.5;

const useAccent = () => {
	const theme = useTheme();
	return theme.palette.mode === "dark"
		? theme.palette.primary.light
		: theme.palette.primary.main;
};

const Tile = ({
	icon: Icon,
	highlighted,
}: {
	icon: LucideIcon;
	highlighted?: boolean;
}) => {
	const theme = useTheme();
	const accent = useAccent();
	return (
		<Box
			width={TILE_SIZE}
			height={TILE_SIZE}
			flexShrink={0}
			display="flex"
			alignItems="center"
			justifyContent="center"
			borderRadius={`${theme.shape.borderRadius}px`}
			border={`1px solid ${highlighted ? accent : theme.palette.neutral.border}`}
			bgcolor={
				highlighted ? theme.palette.neutral.selectedGreen : theme.palette.neutral.raised
			}
			color={highlighted ? accent : theme.palette.text.secondary}
		>
			<Icon
				size={ICON_SIZE}
				strokeWidth={STROKE_WIDTH}
			/>
		</Box>
	);
};

// Encrypted link: a dashed line with a lock badge in the middle
const Connector = () => {
	const theme = useTheme();
	const accent = useAccent();
	return (
		<Box
			width={CONNECTOR_WIDTH}
			flexShrink={0}
			position="relative"
			display="flex"
			alignItems="center"
			justifyContent="center"
		>
			<Box
				width="100%"
				borderTop={`${STROKE_WIDTH}px dashed ${accent}`}
			/>
			<Box
				position="absolute"
				width={BADGE_SIZE}
				height={BADGE_SIZE}
				display="flex"
				alignItems="center"
				justifyContent="center"
				borderRadius="50%"
				border={`1px solid ${accent}`}
				bgcolor={theme.palette.background.paper}
				color={accent}
			>
				<Lock
					size={BADGE_ICON_SIZE}
					strokeWidth={2}
				/>
			</Box>
		</Box>
	);
};

// This server, an encrypted tunnel, Checkmate Connect, and the device you reach it from
export const ConnectIllustration = () => (
	<Stack
		direction="row"
		alignItems="center"
		aria-hidden="true"
	>
		<Tile icon={Server} />
		<Connector />
		<Tile
			icon={CloudCheck}
			highlighted
		/>
		<Connector />
		<Tile icon={Laptop} />
	</Stack>
);

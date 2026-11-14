import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import type { MonitorStatus } from "@/Types/Monitor";
import type { SxProps } from "@mui/material/styles";
import { getDockerStatePalette } from "@/Utils/MonitorUtils";
import { useTheme, alpha, darken, lighten } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { DockerContainerState } from "@/Types/Check";
import {
	SPACING,
	BADGE,
	RADIUS,
	FONT_WEIGHT,
	LINE_HEIGHT,
	TAG_TINT,
} from "@/Utils/Theme/constants";
import { typographyLevels, type SignalKey } from "@/Utils/Theme/Palette";

export const ValueTypes = ["positive", "negative", "neutral"] as const;
export type ValueType = (typeof ValueTypes)[number];

const STATUS_SIGNAL: Record<MonitorStatus, SignalKey> = {
	up: "success",
	down: "error",
	breached: "error",
	paused: "neutral",
	maintenance: "neutral",
	initializing: "info",
};

const VALUE_SIGNAL: Record<ValueType, SignalKey> = {
	positive: "success",
	negative: "error",
	neutral: "warning",
};

// Flat tinted badge in a signal colour. Status words get a 6px dot in the text
// colour; values (e.g. uptime %) drop the dot and use tabular numbers.
const SignalBadge = ({
	signal,
	children,
	dot = true,
	tabular = false,
	sx,
}: React.PropsWithChildren<{
	signal: SignalKey;
	dot?: boolean;
	tabular?: boolean;
	sx?: SxProps;
}>) => {
	const theme = useTheme();
	const tone = theme.palette.signal[signal];
	return (
		<Box
			display="inline-flex"
			alignItems="center"
			gap={BADGE.DOT_GAP}
			height={BADGE.HEIGHT}
			padding={BADGE.PADDING}
			borderRadius={RADIUS.SM}
			bgcolor={tone.bg}
			color={tone.text}
			fontSize={typographyLevels.s}
			fontWeight={FONT_WEIGHT.MEDIUM}
			lineHeight={LINE_HEIGHT.TIGHT}
			whiteSpace="nowrap"
			sx={{ ...(tabular && { fontVariantNumeric: "tabular-nums" }), ...sx }}
		>
			{dot && (
				<Box
					width={BADGE.DOT}
					height={BADGE.DOT}
					borderRadius="50%"
					bgcolor="currentColor"
					flexShrink={0}
				/>
			)}
			{children}
		</Box>
	);
};

export const StatusLabel = ({ status, sx }: { status: MonitorStatus; sx?: SxProps }) => {
	const { t } = useTranslation();

	const determineStatus = (status: MonitorStatus): string => {
		if (status === "up") {
			return t("pages.common.monitors.status.up");
		} else if (status === "down") {
			return t("pages.common.monitors.status.down");
		} else if (status === "breached") {
			return t("pages.common.monitors.status.breached");
		} else if (status === "maintenance") {
			return t("pages.common.monitors.status.maintenance");
		} else if (status === "paused") {
			return t("pages.common.monitors.status.paused");
		} else if (status === "initializing") {
			return t("pages.common.monitors.status.initializing");
		}

		return t("pages.common.monitors.status.initializing");
	};

	const label = determineStatus(status);
	return (
		<SignalBadge
			signal={STATUS_SIGNAL[status] ?? "info"}
			sx={sx}
		>
			{label.charAt(0).toUpperCase() + label.slice(1)}
		</SignalBadge>
	);
};

export const ValueLabel = ({
	value,
	text,
	preserveCase = false,
}: {
	value: ValueType;
	text: string;
	preserveCase?: boolean;
}) => {
	const transformedText = preserveCase
		? text
		: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

	return <SignalBadge signal={VALUE_SIGNAL[value]}>{transformedText}</SignalBadge>;
};

// A number or short value in a signal tint (e.g. uptime %)
export const SignalLabel = ({ text, signal }: { text: string; signal: SignalKey }) => (
	<SignalBadge
		signal={signal}
		dot={false}
		tabular
	>
		{text}
	</SignalBadge>
);

// Category badge in a user-chosen colour (tags): flat tint of the colour with
// darker text in the same hue, 4px corners, no border.
export const ColoredLabel = ({ text, color }: { text: string; color: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	let bg = color;
	let fg = color;
	try {
		bg = alpha(color, isDark ? TAG_TINT.BG_DARK : TAG_TINT.BG_LIGHT);
		fg = isDark
			? lighten(color, TAG_TINT.TEXT_SHIFT)
			: darken(color, TAG_TINT.TEXT_SHIFT);
	} catch {
		// Not a colour MUI can parse; fall back to the raw value
	}

	return (
		<Box
			display="inline-flex"
			alignItems="center"
			width="fit-content"
			height={BADGE.TAG_HEIGHT}
			padding={BADGE.PADDING}
			borderRadius={RADIUS.SM}
			bgcolor={bg}
			color={fg}
			fontSize={typographyLevels.sm}
			fontWeight={FONT_WEIGHT.MEDIUM}
			lineHeight={LINE_HEIGHT.TIGHT}
			whiteSpace="nowrap"
		>
			{text}
		</Box>
	);
};

export const DockerStateLabel = ({
	state,
	name,
	image,
}: {
	state: DockerContainerState;
	name: string;
	image: string;
}) => {
	const palette = getDockerStatePalette(state);
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			gap={SPACING.LG}
			alignItems={"center"}
		>
			<Box
				width={BADGE.DOT}
				height={BADGE.DOT}
				bgcolor={theme.palette[palette].main}
				borderRadius="50%"
				marginRight="5px"
			/>
			<Stack>
				<Typography>{name}</Typography>
				<Typography variant="body2">{image}</Typography>
			</Stack>
		</Stack>
	);
};

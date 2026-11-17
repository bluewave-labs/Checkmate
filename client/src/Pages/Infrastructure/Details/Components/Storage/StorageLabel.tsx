import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/design-elements";

import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import type { StorageTone } from "@/Utils/StorageUtils";

// Status chip for arrays, members and drives. Mirrors ValueLabel, with a muted tone for states that are
// neither good nor bad (asleep, spare, not supported).
export const StorageLabel = ({ tone, text }: { tone: StorageTone; text: string }) => {
	const theme = useTheme();
	const color =
		tone === "muted" ? theme.palette.text.secondary : theme.palette[tone].main;
	const dotColor =
		tone === "muted" ? theme.palette.text.secondary : theme.palette[tone].light;

	return (
		<BaseBox
			display="inline-flex"
			alignItems="center"
			gap={theme.spacing(LAYOUT.XS)}
			px={theme.spacing(LAYOUT.XS)}
			py={theme.spacing(LAYOUT.XXS / 2)}
			color={color}
			whiteSpace="nowrap"
			sx={{
				borderColor:
					theme.palette.mode === "dark"
						? "rgba(255, 255, 255, 0.08)"
						: "rgba(0, 0, 0, 0.08)",
			}}
		>
			<Box
				width={LAYOUT.SM}
				height={LAYOUT.SM}
				bgcolor={dotColor}
				borderRadius="50%"
				aria-hidden
			/>
			<Typography
				fontSize={typographyLevels.s}
				fontWeight={600}
				color={color}
			>
				{text}
			</Typography>
		</BaseBox>
	);
};

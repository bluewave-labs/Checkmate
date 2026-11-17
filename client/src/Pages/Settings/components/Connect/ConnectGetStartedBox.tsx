import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ClipboardPaste, Globe, Server, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { LAYOUT } from "@/Utils/Theme/constants";
import { CONNECT_SITE_URL } from "./constants";

const STEPS = ["account", "server", "paste", "remoteAccess"] as const;
type Step = (typeof STEPS)[number];

const STEP_ICONS: Record<Step, LucideIcon> = {
	account: UserPlus,
	server: Server,
	paste: ClipboardPaste,
	remoteAccess: Globe,
};

const TILE_SIZE = 36;
const ICON_SIZE = 18;
const ICON_STROKE_WIDTH = 1.75;
const NUMBER_BADGE_SIZE = 16;
const NUMBER_BADGE_OFFSET = -6;
// Button renders an <a> when given href; its props type only covers <button>, so spread these
const NEW_TAB_LINK = { target: "_blank", rel: "noopener noreferrer" };

const StepTile = ({ icon: Icon, number }: { icon: LucideIcon; number: number }) => {
	const theme = useTheme();
	const accent =
		theme.palette.mode === "dark"
			? theme.palette.primary.light
			: theme.palette.primary.main;
	return (
		<Box
			position="relative"
			width={TILE_SIZE}
			height={TILE_SIZE}
			flexShrink={0}
			display="flex"
			alignItems="center"
			justifyContent="center"
			borderRadius={`${theme.shape.borderRadius}px`}
			border={`1px solid ${theme.palette.neutral.hairline}`}
			bgcolor={theme.palette.neutral.raised}
			color={accent}
		>
			<Icon
				size={ICON_SIZE}
				strokeWidth={ICON_STROKE_WIDTH}
			/>
			<Box
				position="absolute"
				top={NUMBER_BADGE_OFFSET}
				right={NUMBER_BADGE_OFFSET}
				width={NUMBER_BADGE_SIZE}
				height={NUMBER_BADGE_SIZE}
				display="flex"
				alignItems="center"
				justifyContent="center"
				borderRadius="50%"
				border={`1px solid ${theme.palette.neutral.border}`}
				bgcolor={theme.palette.background.paper}
				color={theme.palette.text.secondary}
				fontSize={typographyLevels.s}
				fontWeight={600}
				lineHeight={1}
			>
				{number}
			</Box>
		</Box>
	);
};

export const ConnectGetStartedBox = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const stepKey = (step: Step, part: "title" | "body") =>
		`pages.settings.form.connect.getStarted.steps.${step}.${part}`;

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.getStarted.title")}
			subtitle={t("pages.settings.form.connect.getStarted.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.MD)}
					alignItems="flex-start"
				>
					<Stack
						component="ol"
						m={0}
						p={0}
						sx={{ listStyle: "none" }}
					>
						{STEPS.map((step, index) => {
							const isLast = index === STEPS.length - 1;
							return (
								<Stack
									component="li"
									key={step}
									position="relative"
									direction="row"
									gap={theme.spacing(LAYOUT.MD)}
									alignItems="flex-start"
									pb={isLast ? 0 : theme.spacing(LAYOUT.MD)}
								>
									{/* Line joining this step's tile to the next one */}
									{!isLast && (
										<Box
											position="absolute"
											left={TILE_SIZE / 2}
											top={TILE_SIZE}
											bottom={0}
											borderLeft={`1px solid ${theme.palette.neutral.hairline}`}
										/>
									)}
									<StepTile
										icon={STEP_ICONS[step]}
										number={index + 1}
									/>
									<Stack>
										<Typography
											fontWeight={600}
											color={theme.palette.text.primary}
										>
											{t(stepKey(step, "title"))}
										</Typography>
										<Typography color={theme.palette.text.secondary}>
											{t(stepKey(step, "body"))}
										</Typography>
									</Stack>
								</Stack>
							);
						})}
					</Stack>
					<Button
						variant="contained"
						href={CONNECT_SITE_URL}
						{...NEW_TAB_LINK}
					>
						{t("pages.settings.form.connect.getStarted.button")}
					</Button>
				</Stack>
			}
		/>
	);
};

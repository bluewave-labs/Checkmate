import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { LAYOUT } from "@/Utils/Theme/constants";
import { ConnectIllustration } from "./ConnectIllustration";
import { CONNECT_SITE_URL } from "./constants";

const STEPS = ["account", "server", "paste", "remoteAccess"] as const;
type Step = (typeof STEPS)[number];

const ILLUSTRATION_MAX_WIDTH = 320;
const STEP_MARKER_SIZE = 22;
// Button renders an <a> when given href; its props type only covers <button>, so spread these
const NEW_TAB_LINK = { target: "_blank", rel: "noopener noreferrer" };

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
					<Box
						width="100%"
						maxWidth={ILLUSTRATION_MAX_WIDTH}
					>
						<ConnectIllustration />
					</Box>
					<Stack
						component="ol"
						gap={theme.spacing(LAYOUT.MD)}
						m={0}
						p={0}
						sx={{ listStyle: "none" }}
					>
						{STEPS.map((step, index) => (
							<Stack
								component="li"
								key={step}
								direction="row"
								gap={theme.spacing(LAYOUT.SM)}
								alignItems="flex-start"
							>
								<Box
									width={STEP_MARKER_SIZE}
									height={STEP_MARKER_SIZE}
									flexShrink={0}
									display="flex"
									alignItems="center"
									justifyContent="center"
									borderRadius="50%"
									border={`1px solid ${theme.palette.neutral.border}`}
									color={theme.palette.text.secondary}
									fontSize={typographyLevels.s}
									fontWeight={600}
								>
									{index + 1}
								</Box>
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
						))}
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

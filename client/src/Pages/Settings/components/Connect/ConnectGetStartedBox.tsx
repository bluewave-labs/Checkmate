import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ClipboardPaste, Globe, Server, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConfigBox, StepList } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
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

// Button renders an <a> when given href; its props type only covers <button>, so spread these
const NEW_TAB_LINK = { target: "_blank", rel: "noopener noreferrer" };

export const ConnectGetStartedBox = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const stepKey = (step: Step, part: "title" | "body") =>
		`pages.settings.form.connect.getStarted.steps.${step}.${part}`;

	const steps = STEPS.map((step) => ({
		icon: STEP_ICONS[step],
		title: t(stepKey(step, "title")),
		description: t(stepKey(step, "body")),
	}));

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.getStarted.title")}
			subtitle={t("pages.settings.form.connect.getStarted.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.MD)}
					alignItems="flex-start"
				>
					<StepList steps={steps} />
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

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox, ValueLabel } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { ConnectStatus } from "@/Types/Connect";

export const ConnectStatusBox = ({ status }: { status: ConnectStatus }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.status.title")}
			subtitle={t("pages.settings.form.connect.status.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.SM)}
					alignItems="flex-start"
				>
					<ValueLabel
						value={status.enrolled ? "positive" : "neutral"}
						text={t(
							status.enrolled
								? "pages.settings.form.connect.status.enrolled"
								: "pages.settings.form.connect.status.notEnrolled"
						)}
					/>
					{status.enrolled && (
						<Typography color={theme.palette.text.secondary}>
							{t("pages.settings.form.connect.status.agentId")}: {status.agentId}
						</Typography>
					)}
				</Stack>
			}
		/>
	);
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox, ValueLabel } from "@/Components/design-elements";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { ConnectStatus } from "@/Types/Connect";

export const ConnectStatusBox = ({ status }: { status: ConnectStatus }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	const tunnelLabelKey = () => {
		if (status.tunnel.connected) return "pages.settings.form.connect.status.connected";
		if (!status.remoteAccess.enabled)
			return "pages.settings.form.connect.status.remoteAccessOff";
		if (status.tunnel.lastError) return "pages.settings.form.connect.status.disconnected";
		return "pages.settings.form.connect.status.connecting";
	};

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.status.title")}
			subtitle={t("pages.settings.form.connect.status.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.SM)}
					alignItems="flex-start"
				>
					<Stack
						direction="row"
						gap={theme.spacing(LAYOUT.SM)}
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
							<ValueLabel
								value={status.tunnel.connected ? "positive" : "neutral"}
								text={t(tunnelLabelKey())}
							/>
						)}
					</Stack>
					{status.enrolled && (
						<Typography color={theme.palette.text.secondary}>
							{t("pages.settings.form.connect.status.agentId")}: {status.agentId}
						</Typography>
					)}
					{status.enrolled && status.tunnel.lastConnectedAt && (
						<Typography color={theme.palette.text.secondary}>
							{t("pages.settings.form.connect.status.lastConnected")}:{" "}
							{formatDate(status.tunnel.lastConnectedAt, "dateTime")}
						</Typography>
					)}
					{status.enrolled && status.tunnel.lastError && (
						<Typography color={theme.palette.error.main}>
							{status.tunnel.lastError}
						</Typography>
					)}
				</Stack>
			}
		/>
	);
};

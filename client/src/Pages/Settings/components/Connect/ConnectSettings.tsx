import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import { useIsSuperAdmin } from "@/Hooks/useIsAdmin";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { ConnectStatus } from "@/Types/Connect";
import { ConnectEnrollBox } from "./ConnectEnrollBox";
import { ConnectRemoteAccessBox } from "./ConnectRemoteAccessBox";
import { ConnectStatusBox } from "./ConnectStatusBox";
import { ConnectUnenrollBox } from "./ConnectUnenrollBox";

export const ConnectSettings = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isSuperAdmin = useIsSuperAdmin();
	const { data: status, refetch } = useGet<ConnectStatus>("/connect/status", undefined, {
		refreshInterval: 5000,
	});

	if (!status) return null;

	return (
		<Stack gap={theme.spacing(LAYOUT.MD)}>
			{!isSuperAdmin && (
				<Typography color={theme.palette.text.secondary}>
					{t("pages.settings.form.connect.superadminOnly")}
				</Typography>
			)}
			<ConnectStatusBox status={status} />
			{isSuperAdmin && !status.enrolled && <ConnectEnrollBox onEnrolled={refetch} />}
			{isSuperAdmin && status.enrolled && (
				<ConnectRemoteAccessBox
					enabled={status.remoteAccess.enabled}
					onChanged={refetch}
				/>
			)}
			{isSuperAdmin && status.enrolled && <ConnectUnenrollBox onUnenrolled={refetch} />}
		</Stack>
	);
};

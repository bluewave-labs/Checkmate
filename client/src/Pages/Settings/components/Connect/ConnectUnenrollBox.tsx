import { useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox, NoticeBanner } from "@/Components/design-elements";
import { usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { ConnectSsoStatus, ConnectStatus } from "@/Types/Connect";
import { TipButton } from "./TipButton";

export const ConnectUnenrollBox = ({
	sso,
	onUnenrolled,
}: {
	sso: ConnectSsoStatus;
	onUnenrolled: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [confirming, setConfirming] = useState(false);
	const { post, loading } = usePost<Record<string, never>, ConnectStatus>();

	const handleUnenroll = async () => {
		if (!confirming) {
			setConfirming(true);
			return;
		}
		setConfirming(false);
		const result = await post("/connect/unenroll", {});
		if (result?.success) await onUnenrolled();
	};

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.unenroll.title")}
			subtitle={t("pages.settings.form.connect.unenroll.description")}
			rightContent={
				<Stack
					gap={theme.spacing(LAYOUT.MD)}
					alignItems="flex-start"
				>
					{sso.linkedUsers > 0 && (
						<NoticeBanner severity="warning">
							{t("pages.settings.form.connect.unenroll.ssoWarning", {
								linked: sso.linkedUsers,
								withoutPassword: sso.linkedWithoutPassword,
							})}
						</NoticeBanner>
					)}
					<TipButton
						tip={t("pages.settings.form.connect.tooltips.unenroll")}
						variant="contained"
						color="error"
						loading={loading}
						onClick={handleUnenroll}
					>
						{t(
							confirming
								? "pages.settings.form.connect.clickToConfirm"
								: "pages.settings.form.connect.unenroll.button"
						)}
					</TipButton>
				</Stack>
			}
		/>
	);
};

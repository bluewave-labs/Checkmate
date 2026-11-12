import { useState } from "react";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { usePost } from "@/Hooks/UseApi";
import type { ConnectStatus } from "@/Types/Connect";
import { TipButton } from "./TipButton";

export const ConnectUnenrollBox = ({
	onUnenrolled,
}: {
	onUnenrolled: () => Promise<unknown>;
}) => {
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
				<Box>
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
				</Box>
			}
		/>
	);
};

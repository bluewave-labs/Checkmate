import { useState } from "react";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import type { ConnectStatus } from "@/Types/Connect";

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
					<Button
						variant="contained"
						color="error"
						loading={loading}
						onClick={handleUnenroll}
					>
						{t(
							confirming
								? "pages.settings.form.connect.unenroll.confirm"
								: "pages.settings.form.connect.unenroll.button"
						)}
					</Button>
				</Box>
			}
		/>
	);
};

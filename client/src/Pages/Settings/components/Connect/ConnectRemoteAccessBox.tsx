import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { SwitchComponent } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import type { ConnectRemoteAccessBody, ConnectStatus } from "@/Types/Connect";

export const ConnectRemoteAccessBox = ({
	enabled,
	onChanged,
}: {
	enabled: boolean;
	onChanged: () => Promise<unknown>;
}) => {
	const { t } = useTranslation();
	const { post, loading } = usePost<ConnectRemoteAccessBody, ConnectStatus>();

	const handleChange = async (checked: boolean) => {
		const result = await post("/connect/remote-access", { enabled: checked });
		if (!result?.success) return;
		await onChanged();
	};

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.remoteAccess.title")}
			subtitle={t("pages.settings.form.connect.remoteAccess.description")}
			rightContent={
				<SwitchComponent
					checked={enabled}
					disabled={loading}
					onChange={(_, checked) => void handleChange(checked)}
				/>
			}
		/>
	);
};

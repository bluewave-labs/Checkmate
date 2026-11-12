import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ConfigBox } from "@/Components/design-elements";
import { TextField } from "@/Components/inputs";
import { usePost } from "@/Hooks/UseApi";
import { parseCredentialBlock } from "@/Utils/connectCredentials";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { ConnectEnrollBody, ConnectStatus } from "@/Types/Connect";
import { TipButton } from "./TipButton";

const CREDENTIAL_PLACEHOLDER =
	"CONNECT_URL=wss://...\nCONNECT_AGENT=inst-...\nCONNECT_TOKEN=cmk_...";

export const ConnectEnrollBox = ({
	onEnrolled,
}: {
	onEnrolled: () => Promise<unknown>;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [credentialBlock, setCredentialBlock] = useState("");
	const { post, loading } = usePost<ConnectEnrollBody, ConnectStatus>();
	const parsed = parseCredentialBlock(credentialBlock);

	const handleEnroll = async () => {
		if (!parsed) return;
		const result = await post("/connect/enroll", parsed);
		if (result?.success) {
			setCredentialBlock("");
			await onEnrolled();
		}
	};

	return (
		<ConfigBox
			title={t("pages.settings.form.connect.enroll.title")}
			subtitle={t("pages.settings.form.connect.enroll.description")}
			rightContent={
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<TextField
						multiline
						minRows={3}
						value={credentialBlock}
						onChange={(event) => setCredentialBlock(event.target.value)}
						placeholder={CREDENTIAL_PLACEHOLDER}
					/>
					<Box>
						<TipButton
							tip={t("pages.settings.form.connect.tooltips.enroll")}
							variant="contained"
							disabled={!parsed}
							loading={loading}
							onClick={handleEnroll}
						>
							{t("pages.settings.form.connect.enroll.button")}
						</TipButton>
					</Box>
				</Stack>
			}
		/>
	);
};

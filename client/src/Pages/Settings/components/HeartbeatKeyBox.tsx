import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { KeyRound, RefreshCw } from "lucide-react";
import { ConfigBox, CopyRow, Icon } from "@/Components/design-elements";
import { Button, Dialog } from "@/Components/inputs";
import { useGet, usePost } from "@/Hooks/UseApi";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { HeartbeatKeyResponse, HeartbeatKeyStatusResponse } from "@/Types/Team";

const KEY_URL = "/teams/heartbeat-key";

// Rendered for admins only (both endpoints are admin/superadmin)
export const HeartbeatKeyBox = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [revealedKey, setRevealedKey] = useState<string | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const { data, refetch } = useGet<HeartbeatKeyStatusResponse>(KEY_URL);
	const { post, loading } = usePost<Record<string, never>, HeartbeatKeyResponse>();
	const hasKey = data?.hasKey ?? false;

	// The key is only returned here; the server keeps just its hash
	const rotate = async () => {
		const result = await post(KEY_URL, {});
		setIsConfirmOpen(false);
		if (result?.success && result.data) {
			setRevealedKey(result.data.heartbeatKey);
			await refetch();
		}
	};

	// Generating the first key breaks nothing, so only rotation asks for confirmation
	const handleClick = () => (hasKey ? setIsConfirmOpen(true) : rotate());

	return (
		<>
			<ConfigBox
				title={t("pages.settings.form.heartbeatKey.title")}
				subtitle={t("pages.settings.form.heartbeatKey.description")}
				rightContent={
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						{revealedKey ? (
							<>
								<CopyRow
									label={t("pages.settings.form.heartbeatKey.keyLabel")}
									value={revealedKey}
								/>
								<Typography color={theme.palette.warning.main}>
									{t("pages.settings.form.heartbeatKey.copyNow")}
								</Typography>
							</>
						) : (
							<Typography color={theme.palette.text.secondary}>
								{t(
									hasKey
										? "pages.settings.form.heartbeatKey.keySet"
										: "pages.settings.form.heartbeatKey.noKey"
								)}
							</Typography>
						)}
						<Box>
							<Button
								variant="contained"
								color={hasKey ? "secondary" : "primary"}
								startIcon={<Icon icon={hasKey ? RefreshCw : KeyRound} />}
								loading={loading}
								onClick={handleClick}
							>
								{t(
									hasKey
										? "pages.settings.form.heartbeatKey.rotate"
										: "pages.settings.form.heartbeatKey.generate"
								)}
							</Button>
						</Box>
					</Stack>
				}
			/>
			<Dialog
				open={isConfirmOpen}
				title={t("pages.settings.form.heartbeatKey.rotateConfirmTitle")}
				content={t("pages.settings.form.heartbeatKey.rotateConfirmBody")}
				confirmText={t("pages.settings.form.heartbeatKey.rotate")}
				confirmColor="error"
				onConfirm={rotate}
				onCancel={() => setIsConfirmOpen(false)}
				loading={loading}
			/>
		</>
	);
};

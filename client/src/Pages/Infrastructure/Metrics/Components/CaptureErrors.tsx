import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/design-elements";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { CheckErrorInfo } from "@/Types/Check";
import { LAYOUT } from "@/Utils/Theme/constants";

export const CaptureErrors = ({ errors }: { errors: CheckErrorInfo[] }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (errors.length === 0) return null;

	return (
		<BaseBox padding={theme.spacing(LAYOUT.MD)}>
			<Stack gap={theme.spacing(LAYOUT.XS)}>
				<Typography
					variant="eyebrow"
					color={theme.palette.text.secondary}
				>
					{t("pages.infrastructure.agentErrors.title")}
				</Typography>
				{errors.map((error) => (
					<Stack
						key={`${error.metric.join()}-${error.err}`}
						direction="row"
						gap={theme.spacing(LAYOUT.MD)}
					>
						<Typography color={theme.palette.text.secondary}>
							{error.metric.join(", ")}
						</Typography>
						<Typography>{error.err}</Typography>
					</Stack>
				))}
			</Stack>
		</BaseBox>
	);
};

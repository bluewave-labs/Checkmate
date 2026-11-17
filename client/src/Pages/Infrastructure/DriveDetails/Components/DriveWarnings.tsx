import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/design-elements";
import { StorageSection } from "@/Pages/Infrastructure/Details/Components/Storage/StorageSection";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { SmartWarning } from "@/Types/Check";
import { LAYOUT } from "@/Utils/Theme/constants";
import { getWarningTone } from "@/Utils/StorageUtils";

const LABEL_WIDTH = 220;

// smartctl's warning flags in plain language. Capture does not say which attribute crossed a threshold.
export const DriveWarnings = ({ warnings }: { warnings: SmartWarning[] }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<StorageSection title={t("pages.infrastructure.drive.warnings.title")}>
			<BaseBox p={theme.spacing(LAYOUT.MD)}>
				{warnings.length === 0 ? (
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.drive.warnings.none")}
					</Typography>
				) : (
					<Stack
						component="ul"
						m={0}
						p={0}
						sx={{ listStyle: "none" }}
					>
						{warnings.map((warning, index) => (
							<Stack
								component="li"
								key={warning}
								direction="row"
								flexWrap="wrap"
								gap={theme.spacing(LAYOUT.XL)}
								py={theme.spacing(LAYOUT.LG)}
								borderTop={index > 0 ? `1px solid ${theme.palette.divider}` : "none"}
							>
								<Typography
									flex={`0 0 ${LABEL_WIDTH}px`}
									fontWeight={600}
									color={
										getWarningTone(warning) === "error"
											? theme.palette.error.main
											: theme.palette.warning.main
									}
								>
									{t(`pages.infrastructure.storage.drives.warnings.${warning}`)}
								</Typography>
								<Typography flex="1 1 320px">
									{t(`pages.infrastructure.drive.warnings.descriptions.${warning}`)}
								</Typography>
							</Stack>
						))}
					</Stack>
				)}
			</BaseBox>
		</StorageSection>
	);
};

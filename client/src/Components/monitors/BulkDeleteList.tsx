import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EyeOff } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { StatusLabel } from "@/Components/design-elements";
import { getMonitorTypeLabel } from "@/Types/Monitor";
import type { BulkDeleteTarget } from "@/Hooks/useBulkMonitorActions";
import { formatUrl } from "@/Utils/MonitorUtils";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface BulkDeleteListProps {
	targets: BulkDeleteTarget[];
}

export const BulkDeleteList = ({ targets }: BulkDeleteListProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<Stack
			component="ul"
			m={0}
			p={0}
			border={`1px solid ${theme.palette.divider}`}
			borderRadius={theme.shape.borderRadius}
			sx={{ listStyle: "none" }}
		>
			{targets.map(({ id, monitor, hidden }, index) => {
				const details = monitor
					? [getMonitorTypeLabel(monitor.type, t), formatUrl(monitor.url)]
							.filter(Boolean)
							.join(" · ")
					: id;

				return (
					<Stack
						key={id}
						component="li"
						direction="row"
						alignItems="center"
						gap={theme.spacing(LAYOUT.MD)}
						px={theme.spacing(LAYOUT.MD)}
						py={theme.spacing(LAYOUT.SM)}
						borderTop={index > 0 ? `1px solid ${theme.palette.divider}` : undefined}
					>
						<Stack
							flex={1}
							minWidth={0}
							gap={theme.spacing(LAYOUT.XXS)}
						>
							<Typography
								fontWeight={500}
								color={theme.palette.text.primary}
								overflow="hidden"
								textOverflow="ellipsis"
								whiteSpace="nowrap"
							>
								{monitor?.name ?? id}
							</Typography>
							<Typography
								fontSize={typographyLevels.s}
								fontFamily={theme.typography.fontFamilyMonospace}
								color={theme.palette.text.secondary}
								overflow="hidden"
								textOverflow="ellipsis"
								whiteSpace="nowrap"
							>
								{details}
							</Typography>
							{hidden && (
								<Stack
									direction="row"
									alignItems="center"
									gap={theme.spacing(LAYOUT.XS)}
									color={theme.palette.warning.main}
								>
									<EyeOff size={14} />
									<Typography
										fontSize={typographyLevels.s}
										color={theme.palette.warning.main}
									>
										{t("pages.common.monitors.bulkDelete.hidden")}
									</Typography>
								</Stack>
							)}
						</Stack>
						{monitor && (
							<Box flexShrink={0}>
								<StatusLabel status={monitor.status} />
							</Box>
						)}
					</Stack>
				);
			})}
		</Stack>
	);
};

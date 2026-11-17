import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { BaseBox } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { Fragment } from "react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import type { CheckRaidArray } from "@/Types/Check";
import type { LatestDrive } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatNumber, PLACEHOLDER } from "@/Utils/FormatUtils";
import { hasDriveValues, parseCount } from "@/Utils/StorageUtils";

const HOURS_PER_YEAR = 8766;
const FIELD_MIN_WIDTH = 150;

const Field = ({ label, children }: React.PropsWithChildren<{ label: string }>) => {
	const theme = useTheme();
	return (
		<Stack minWidth={0}>
			<Typography
				fontSize={typographyLevels.s}
				color={theme.palette.text.secondary}
			>
				{label}
			</Typography>
			<Typography
				component="div"
				fontWeight={600}
				sx={{ overflowWrap: "anywhere" }}
			>
				{children}
			</Typography>
		</Stack>
	);
};

export const DriveIdentity = ({
	monitorId,
	drive,
	arrays,
}: {
	monitorId: string;
	drive: LatestDrive;
	arrays: CheckRaidArray[];
}) => {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const locale = i18n.resolvedLanguage ?? "en";

	const hours = hasDriveValues(drive) ? parseCount(drive.power_on_hours) : null;

	return (
		<BaseBox
			display="grid"
			gridTemplateColumns={`repeat(auto-fit, minmax(${FIELD_MIN_WIDTH}px, 1fr))`}
			gap={theme.spacing(LAYOUT.MD)}
			p={theme.spacing(LAYOUT.MD)}
		>
			<Field label={t("pages.infrastructure.drive.identity.serial")}>
				{drive.serial_number || PLACEHOLDER}
			</Field>
			<Field label={t("pages.infrastructure.drive.identity.device")}>
				{drive.protocol
					? t("pages.infrastructure.drive.identity.deviceValue", {
							device: drive.device,
							protocol: drive.protocol,
						})
					: drive.device}
			</Field>
			<Field label={t("pages.infrastructure.drive.identity.capacity")}>
				{drive.capacity_bytes ? prettyBytes(drive.capacity_bytes) : PLACEHOLDER}
			</Field>
			<Field label={t("pages.infrastructure.drive.identity.firmware")}>
				{drive.firmware_version || PLACEHOLDER}
			</Field>
			<Field label={t("pages.infrastructure.drive.identity.powerOn")}>
				{hours === null
					? PLACEHOLDER
					: t("pages.infrastructure.drive.identity.powerOnValue", {
							hours: formatNumber(hours, locale),
							years: (hours / HOURS_PER_YEAR).toFixed(1),
						})}
			</Field>
			<Field label={t("pages.infrastructure.drive.identity.memberOf")}>
				{arrays.length === 0
					? t("pages.infrastructure.drive.identity.none")
					: arrays.map((array, index) => (
							<Fragment key={array.device}>
								{index > 0 && <Box component="span">, </Box>}
								<Link
									component={RouterLink}
									to={`/infrastructure/${monitorId}?tab=storage`}
									color={theme.palette.primary.main}
								>
									{array.device}
								</Link>
							</Fragment>
						))}
			</Field>
		</BaseBox>
	);
};

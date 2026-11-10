import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BasePage } from "@/Components/design-elements";
import { HeaderTimeRange } from "@/Components/common";
import { StorageLabel } from "@/Pages/Infrastructure/Details/Components/Storage/StorageLabel";
import { StorageMessage } from "@/Pages/Infrastructure/Details/Components/Storage/StorageSection";
import { DriveIdentity } from "@/Pages/Infrastructure/DriveDetails/Components/DriveIdentity";
import { DriveIndicators } from "@/Pages/Infrastructure/DriveDetails/Components/DriveIndicators";
import { DriveCharts } from "@/Pages/Infrastructure/DriveDetails/Components/DriveCharts";
import { DriveWarnings } from "@/Pages/Infrastructure/DriveDetails/Components/DriveWarnings";

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import type { HardwareDetailsResponse } from "@/Types/Monitor";
import type { DateRange } from "@/Types/Query";
import { LAYOUT } from "@/Utils/Theme/constants";
import {
	DRIVE_HEALTH_TONES,
	findDriveArrays,
	getDriveHealth,
} from "@/Utils/StorageUtils";

// One drive of a hardware monitor, keyed by serial number. Uses the hardware details response, which
// carries the latest SMART reading and every drive's history.
const DriveDetails = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const formatDate = useFormatDate();
	const { monitorId, serial } = useParams<{ monitorId: string; serial: string }>();
	const [dateRange, setDateRange] = useState<DateRange>("recent");

	const detailsUrl = useMemo(() => {
		if (!monitorId) return null;
		const params = new URLSearchParams({ dateRange });
		return `/monitors/hardware/details/${monitorId}?${params.toString()}`;
	}, [monitorId, dateRange]);

	const { data, isLoading, error } = useGet<HardwareDetailsResponse>(
		detailsUrl,
		{},
		{ refreshInterval: 10000, keepPreviousData: true }
	);

	const drive = data?.drives?.drives.find((entry) => entry.serial_number === serial);
	const points =
		data?.driveHistory.find((history) => history.serial_number === serial)?.points ?? [];

	const pageProps = {
		headerKey: "infrastructure.drive",
		backTo: `/infrastructure/${monitorId}?tab=storage`,
		backLabel: t("pages.infrastructure.drive.back"),
	};

	if (!data || !monitorId) {
		return (
			<BasePage
				{...pageProps}
				loading={isLoading}
				error={Boolean(error)}
			>
				{null}
			</BasePage>
		);
	}

	if (!drive) {
		return (
			<BasePage {...pageProps}>
				<StorageMessage title={t("pages.infrastructure.drive.notFound.title")}>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.drive.notFound.description")}
					</Typography>
				</StorageMessage>
			</BasePage>
		);
	}

	const health = getDriveHealth(drive);
	const arrays = findDriveArrays(drive, data.raid?.arrays);
	const readAt = drive.lastKnownAt ?? data.drives?.checkedAt;

	return (
		<BasePage {...pageProps}>
			<Stack gap={theme.spacing(LAYOUT.XS)}>
				<Stack
					direction="row"
					flexWrap="wrap"
					alignItems="center"
					gap={theme.spacing(LAYOUT.LG)}
				>
					<Typography
						variant="h1"
						component="h2"
					>
						{drive.model_name || t("pages.infrastructure.storage.drives.unknownDrive")}
					</Typography>
					<StorageLabel
						tone={DRIVE_HEALTH_TONES[health]}
						text={t(`pages.infrastructure.storage.drives.health.${health}`)}
					/>
				</Stack>
				{readAt && (
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.drive.lastRead", {
							time: formatDate(readAt, "dateTimeShort"),
						})}
					</Typography>
				)}
			</Stack>
			<DriveIdentity
				monitorId={monitorId}
				drive={drive}
				arrays={arrays}
			/>
			<HeaderTimeRange
				isLoading={isLoading}
				hasDateRange={true}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<DriveIndicators
				drive={drive}
				points={points}
			/>
			<DriveCharts
				drive={drive}
				points={points}
				dateRange={dateRange}
			/>
			<DriveWarnings warnings={drive.warnings} />
		</BasePage>
	);
};

export default DriveDetails;

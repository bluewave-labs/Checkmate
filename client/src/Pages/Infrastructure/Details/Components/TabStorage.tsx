import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { StorageBanner } from "@/Pages/Infrastructure/Details/Components/Storage/StorageBanner";
import { RaidArrayCard } from "@/Pages/Infrastructure/Details/Components/Storage/RaidArrayCard";
import { DrivesTable } from "@/Pages/Infrastructure/Details/Components/Storage/DrivesTable";
import {
	StorageMessage,
	StorageSection,
} from "@/Pages/Infrastructure/Details/Components/Storage/StorageSection";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { LatestDrives, LatestRaid, Monitor } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatDuration } from "@/Utils/TimeUtils";
import { isSmartctlMissing } from "@/Utils/StorageUtils";

const RAID_CARD_MIN_WIDTH = 320;

export const TabStorage = ({
	monitor,
	raid,
	drives,
}: {
	monitor: Monitor | undefined;
	raid: LatestRaid | null | undefined;
	drives: LatestDrives | null | undefined;
}) => {
	const { t, i18n } = useTranslation();
	const theme = useTheme();

	if (!monitor) return null;

	// Neither RAID nor per-drive SMART: Capture predates storage health
	if (!raid && !drives) {
		return (
			<StorageMessage title={t("pages.infrastructure.storage.updateCapture.title")}>
				<Typography color={theme.palette.text.secondary}>
					{t("pages.infrastructure.storage.updateCapture.description")}
				</Typography>
			</StorageMessage>
		);
	}

	const arrays = raid?.arrays ?? [];
	const driveList = drives?.drives ?? [];
	const recentChecks = monitor.recentChecks ?? [];
	const disks = recentChecks[recentChecks.length - 1]?.disk;

	const renderRaid = () => {
		if (!raid) {
			return (
				<StorageMessage>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.storage.raid.notReported")}
					</Typography>
				</StorageMessage>
			);
		}
		if (arrays.length === 0) {
			return (
				<StorageMessage>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.storage.raid.noArrays")}
					</Typography>
				</StorageMessage>
			);
		}
		return (
			<Box
				display="grid"
				gridTemplateColumns={`repeat(auto-fill, minmax(min(${RAID_CARD_MIN_WIDTH}px, 100%), 1fr))`}
				gap={theme.spacing(LAYOUT.MD)}
			>
				{arrays.map((array) => (
					<RaidArrayCard
						key={array.device}
						array={array}
						disks={disks}
						drives={driveList}
					/>
				))}
			</Box>
		);
	};

	const renderDrives = () => {
		if (!drives) {
			return (
				<StorageMessage>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.storage.drives.notFetched")}
					</Typography>
				</StorageMessage>
			);
		}
		if (driveList.length > 0) {
			return (
				<DrivesTable
					monitorId={monitor.id}
					drives={driveList}
					errors={drives.errors}
				/>
			);
		}
		// No drives: explain why when Capture said so
		const reason = drives.errors[0]?.err;
		if (!reason) {
			return (
				<StorageMessage>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.storage.drives.none")}
					</Typography>
				</StorageMessage>
			);
		}
		return (
			<StorageMessage title={t("pages.infrastructure.storage.drives.unavailableTitle")}>
				<Typography>
					{t("pages.infrastructure.storage.drives.unavailableReason", { reason })}
				</Typography>
				{isSmartctlMissing(drives.errors) && (
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.storage.drives.installGuidance")}
					</Typography>
				)}
			</StorageMessage>
		);
	};

	const drivesSubtitle = drives
		? t("pages.infrastructure.storage.drives.subtitle", {
				time: formatDuration(Date.now() - new Date(drives.checkedAt).getTime(), {
					long: true,
					relative: true,
					locale: i18n.resolvedLanguage,
				}),
			})
		: undefined;

	return (
		<Stack gap={theme.spacing(LAYOUT.XXL)}>
			<StorageBanner
				arrays={arrays}
				drives={driveList}
			/>
			<StorageSection
				title={t("pages.infrastructure.storage.raid.title")}
				subtitle={t("pages.infrastructure.storage.raid.subtitle")}
			>
				{renderRaid()}
			</StorageSection>
			<StorageSection
				title={t("pages.infrastructure.storage.drives.title")}
				subtitle={drivesSubtitle}
			>
				{renderDrives()}
			</StorageSection>
		</Stack>
	);
};

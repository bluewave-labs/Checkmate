import Box from "@mui/material/Box";
import { NoticeBanner } from "@/Components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { CheckRaidArray } from "@/Types/Check";
import type { LatestDrive } from "@/Types/Monitor";
import {
	getArrayDisks,
	getArrayHealth,
	getRebuildTarget,
	isArrayAtRisk,
	isDriveFailed,
} from "@/Utils/StorageUtils";

// One sentence per problem: which array is missing disks, and which drive to replace by model and serial
export const StorageBanner = ({
	arrays,
	drives,
}: {
	arrays: CheckRaidArray[];
	drives: LatestDrive[];
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const atRiskArrays = arrays.filter(isArrayAtRisk);
	const failedDrives = drives.filter(
		(drive) => drive.status === "ok" && isDriveFailed(drive)
	);
	if (atRiskArrays.length === 0 && failedDrives.length === 0) return null;

	const rebuilding = atRiskArrays.some((array) => getRebuildTarget(array));

	const describeArray = (array: CheckRaidArray): string => {
		if (getArrayHealth(array) === "inactive") {
			return t("pages.infrastructure.storage.banner.arrayInactive", {
				device: array.device,
			});
		}
		const disks = getArrayDisks(array);
		if (!disks) {
			return t("pages.infrastructure.storage.banner.arrayMissingUnknown", {
				device: array.device,
			});
		}
		const values = {
			device: array.device,
			missing: disks.total - disks.present,
			total: disks.total,
		};
		const target = getRebuildTarget(array);
		return target
			? t("pages.infrastructure.storage.banner.arrayRebuilding", {
					...values,
					target: target.device,
				})
			: t("pages.infrastructure.storage.banner.arrayMissing", values);
	};

	const describeDrive = (drive: LatestDrive): string =>
		t(
			rebuilding
				? "pages.infrastructure.storage.banner.replaceDriveAfterRebuild"
				: "pages.infrastructure.storage.banner.replaceDrive",
			{ model: drive.model_name, serial: drive.serial_number, device: drive.device }
		);

	const title = [
		atRiskArrays.length > 0 &&
			t("pages.infrastructure.storage.banner.arraysAtRisk", {
				count: atRiskArrays.length,
			}),
		failedDrives.length > 0 &&
			t("pages.infrastructure.storage.banner.drivesFailing", {
				count: failedDrives.length,
			}),
	]
		.filter(Boolean)
		.join(", ");

	const sentences = [
		...atRiskArrays.map(describeArray),
		...failedDrives.map(describeDrive),
	];

	return (
		<Box role="alert">
			<NoticeBanner severity="error">
				<Box
					component="span"
					display="block"
					fontWeight={600}
					color={theme.palette.error.main}
				>
					{title}
				</Box>
				{sentences.join(" ")}
			</NoticeBanner>
		</Box>
	);
};

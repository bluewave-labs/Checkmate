import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import { BaseBox } from "@/Components/design-elements";
import { StorageLabel } from "@/Pages/Infrastructure/Details/Components/Storage/StorageLabel";

import prettyBytes from "pretty-bytes";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { CheckRaidArray, SnapshotDiskInfo } from "@/Types/Check";
import type { LatestDrive } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { PLACEHOLDER } from "@/Utils/FormatUtils";
import {
	ARRAY_HEALTH_TONES,
	MEMBER_STATE_TONES,
	findArrayDisk,
	findMemberDrive,
	formatRaidLevel,
	getArrayDisks,
	getArrayHealth,
	getMemberState,
	getRebuildTarget,
	isArrayAtRisk,
} from "@/Utils/StorageUtils";

const SYNC_LABEL_KEYS = ["resync", "check", "repair", "reshape"];

const Field = ({ label, value }: { label: string; value: string }) => {
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
				fontWeight={600}
				sx={{ overflowWrap: "anywhere" }}
			>
				{value}
			</Typography>
		</Stack>
	);
};

export const RaidArrayCard = ({
	array,
	disks,
	drives,
}: {
	array: CheckRaidArray;
	disks: SnapshotDiskInfo[] | undefined;
	drives: LatestDrive[] | undefined;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const health = getArrayHealth(array);
	const diskCount = getArrayDisks(array);
	const disk = findArrayDisk(array, disks);
	const target = getRebuildTarget(array);
	const progress =
		array.sync_progress === null || array.sync_progress === undefined
			? null
			: Math.round(array.sync_progress * 100);

	const getSyncLabel = (): string => {
		const action = array.sync_action ?? "";
		if (action === "recover") {
			return target
				? t("pages.infrastructure.storage.raid.sync.recover", { target: target.device })
				: t("pages.infrastructure.storage.raid.sync.recoverNoTarget");
		}
		if (SYNC_LABEL_KEYS.includes(action)) {
			return t(`pages.infrastructure.storage.raid.sync.${action}`);
		}
		return t("pages.infrastructure.storage.raid.sync.other");
	};

	return (
		<BaseBox
			display="flex"
			flexDirection="column"
			gap={theme.spacing(LAYOUT.XL)}
			p={theme.spacing(LAYOUT.MD)}
			sx={{
				borderColor: isArrayAtRisk(array)
					? alpha(theme.palette.error.main, 0.45)
					: theme.palette.divider,
			}}
		>
			<Stack
				direction="row"
				flexWrap="wrap"
				alignItems="center"
				gap={theme.spacing(LAYOUT.XS)}
			>
				<Typography variant="h2">{array.device}</Typography>
				{array.level && (
					<StorageLabel
						tone="muted"
						text={formatRaidLevel(array.level)}
					/>
				)}
				<Box ml="auto">
					<StorageLabel
						tone={ARRAY_HEALTH_TONES[health]}
						text={t(`pages.infrastructure.storage.raid.health.${health}`)}
					/>
				</Box>
			</Stack>

			<Box
				display="grid"
				gridTemplateColumns="repeat(3, minmax(0, 1fr))"
				gap={theme.spacing(LAYOUT.XL)}
			>
				<Field
					label={t("pages.infrastructure.storage.raid.disks")}
					value={
						diskCount
							? t("pages.infrastructure.storage.raid.disksValue", diskCount)
							: PLACEHOLDER
					}
				/>
				<Field
					label={t("pages.infrastructure.storage.raid.size")}
					value={disk?.total_bytes ? prettyBytes(disk.total_bytes) : PLACEHOLDER}
				/>
				<Field
					label={t("pages.infrastructure.storage.raid.mountedAt")}
					value={disk?.mountpoint || t("pages.infrastructure.storage.raid.notMounted")}
				/>
			</Box>

			{progress !== null && (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					<Stack
						direction="row"
						justifyContent="space-between"
						gap={theme.spacing(LAYOUT.MD)}
					>
						<Typography fontWeight={500}>{getSyncLabel()}</Typography>
						<Typography fontWeight={600}>{`${progress}%`}</Typography>
					</Stack>
					<LinearProgress
						variant="determinate"
						value={progress}
						aria-label={t("pages.infrastructure.storage.raid.progressLabel")}
						sx={{
							height: LAYOUT.SM,
							borderRadius: theme.shape.borderRadius,
							bgcolor: theme.palette.divider,
						}}
					/>
				</Stack>
			)}

			<Stack
				component="ul"
				m={0}
				p={0}
				borderTop={`1px solid ${theme.palette.divider}`}
				sx={{ listStyle: "none" }}
			>
				{array.members.map((member) => {
					const state = getMemberState(array, member);
					const drive = findMemberDrive(member, drives);
					return (
						<Stack
							component="li"
							key={member.device}
							direction="row"
							alignItems="center"
							justifyContent="space-between"
							gap={theme.spacing(LAYOUT.MD)}
							py={theme.spacing(LAYOUT.XS)}
							borderBottom={`1px solid ${theme.palette.divider}`}
						>
							<Typography sx={{ overflowWrap: "anywhere" }}>
								{member.device}
								{drive?.serial_number && (
									<Box
										component="span"
										color={theme.palette.text.secondary}
									>
										{` · ${drive.serial_number}`}
									</Box>
								)}
							</Typography>
							<StorageLabel
								tone={MEMBER_STATE_TONES[state]}
								text={
									state === "other"
										? member.state
										: t(`pages.infrastructure.storage.raid.member.${state}`)
								}
							/>
						</Stack>
					);
				})}
			</Stack>
		</BaseBox>
	);
};

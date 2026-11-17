import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Table } from "@/Components/design-elements";
import { StorageLabel } from "@/Pages/Infrastructure/Details/Components/Storage/StorageLabel";

import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useFormatDate } from "@/Hooks/useFormatDate";
import type { Header } from "@/Components/design-elements/Table";
import type { CheckErrorInfo } from "@/Types/Check";
import type { LatestDrive } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatNumber, PLACEHOLDER } from "@/Utils/FormatUtils";
import {
	DRIVE_HEALTH_TONES,
	getCounterTone,
	getDriveErrorReason,
	getDriveHealth,
	getDrivePath,
	getWarningTone,
	hasDriveValues,
	isDriveFailed,
	isNvme,
	parseCount,
	parseTemperature,
	type StorageTone,
} from "@/Utils/StorageUtils";

interface DriveRow {
	id: string;
	drive: LatestDrive;
}

interface StatLine {
	key: string;
	text: string;
	tone: StorageTone;
}

export const DrivesTable = ({
	monitorId,
	drives,
	errors,
}: {
	monitorId: string;
	drives: LatestDrive[];
	errors: CheckErrorInfo[];
}) => {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const formatDate = useFormatDate();
	const locale = i18n.resolvedLanguage ?? "en";

	const toneColor = (tone: StorageTone) =>
		tone === "muted" ? theme.palette.text.primary : theme.palette[tone].main;

	const getStatLines = (drive: LatestDrive): StatLine[] => {
		const failed = isDriveFailed(drive);
		const counter = (key: string, value: number | null | undefined): StatLine[] =>
			value === null || value === undefined
				? []
				: [
						{
							key,
							text: t(`pages.infrastructure.storage.drives.counters.${key}`, {
								value: formatNumber(value, locale),
							}),
							tone: getCounterTone(value, failed),
						},
					];
		const percent = (key: string, value: string): StatLine[] =>
			value
				? [
						{
							key,
							text: t(`pages.infrastructure.storage.drives.counters.${key}`, { value }),
							tone: "muted",
						},
					]
				: [];

		if (isNvme(drive)) {
			return [
				...percent("wear", drive.percentage_used),
				...percent("spare", drive.available_spare),
				...counter("mediaErrors", drive.media_errors),
			];
		}
		return [
			...counter("reallocated", drive.reallocated_sectors),
			...counter("pending", drive.pending_sectors),
			...counter("uncorrectable", drive.offline_uncorrectable),
		];
	};

	// Shown in place of values for drives that were not read
	const getStatusNote = (drive: LatestDrive): string | undefined => {
		if (drive.status === "standby")
			return t("pages.infrastructure.storage.drives.asleepNote");
		if (drive.status === "unsupported") {
			return t("pages.infrastructure.storage.drives.unsupportedNote");
		}
		if (drive.status === "error") return getDriveErrorReason(drive, errors);
		return undefined;
	};

	const headers: Header<DriveRow>[] = [
		{
			id: "drive",
			content: t("pages.infrastructure.storage.drives.headers.drive"),
			render: ({ drive }) => {
				const identity = [
					drive.serial_number,
					drive.capacity_bytes ? prettyBytes(drive.capacity_bytes) : "",
				]
					.filter(Boolean)
					.join(" · ");
				return (
					<Stack>
						<Typography fontWeight={600}>
							{drive.model_name || t("pages.infrastructure.storage.drives.unknownDrive")}
						</Typography>
						{identity && (
							<Typography color={theme.palette.text.secondary}>{identity}</Typography>
						)}
						{drive.lastKnownAt && (
							<Typography color={theme.palette.text.secondary}>
								{t("pages.infrastructure.storage.drives.lastKnown", {
									time: formatDate(drive.lastKnownAt, "dateTimeShort"),
								})}
							</Typography>
						)}
					</Stack>
				);
			},
		},
		{
			id: "device",
			content: t("pages.infrastructure.storage.drives.headers.device"),
			render: ({ drive }) => (
				<Stack>
					<Typography>{drive.device}</Typography>
					{drive.protocol && (
						<Typography color={theme.palette.text.secondary}>{drive.protocol}</Typography>
					)}
				</Stack>
			),
		},
		{
			id: "health",
			content: t("pages.infrastructure.storage.drives.headers.health"),
			render: ({ drive }) => {
				const health = getDriveHealth(drive);
				return (
					<StorageLabel
						tone={DRIVE_HEALTH_TONES[health]}
						text={t(`pages.infrastructure.storage.drives.health.${health}`)}
					/>
				);
			},
		},
		{
			id: "temperature",
			content: t("pages.infrastructure.storage.drives.headers.temperature"),
			render: ({ drive }) => {
				const value = hasDriveValues(drive) ? parseTemperature(drive.temperature) : null;
				return (
					<Typography whiteSpace="nowrap">
						{value === null
							? hasDriveValues(drive)
								? PLACEHOLDER
								: t("pages.infrastructure.storage.drives.notRead")
							: t("pages.infrastructure.storage.drives.celsius", { value })}
					</Typography>
				);
			},
		},
		{
			id: "powerOn",
			content: t("pages.infrastructure.storage.drives.headers.powerOn"),
			render: ({ drive }) => {
				const hours = hasDriveValues(drive) ? parseCount(drive.power_on_hours) : null;
				return (
					<Typography whiteSpace="nowrap">
						{hours === null
							? hasDriveValues(drive)
								? PLACEHOLDER
								: t("pages.infrastructure.storage.drives.notRead")
							: t("pages.infrastructure.storage.drives.hours", {
									value: formatNumber(hours, locale),
								})}
					</Typography>
				);
			},
		},
		{
			id: "wearAndErrors",
			content: t("pages.infrastructure.storage.drives.headers.wearAndErrors"),
			render: ({ drive }) => {
				const note = getStatusNote(drive);
				const lines = hasDriveValues(drive) ? getStatLines(drive) : [];
				if (lines.length === 0) {
					return (
						<Typography color={theme.palette.text.secondary}>
							{note ?? PLACEHOLDER}
						</Typography>
					);
				}
				return (
					<Stack>
						{lines.map((line) => (
							<Typography
								key={line.key}
								color={toneColor(line.tone)}
								fontWeight={line.tone === "muted" ? 400 : 600}
							>
								{line.text}
							</Typography>
						))}
					</Stack>
				);
			},
		},
		{
			id: "warnings",
			content: t("pages.infrastructure.storage.drives.headers.warnings"),
			render: ({ drive }) =>
				drive.warnings.length === 0 ? (
					<Typography color={theme.palette.text.secondary}>
						{t("pages.infrastructure.storage.drives.noWarnings")}
					</Typography>
				) : (
					<Stack
						alignItems="flex-start"
						gap={theme.spacing(LAYOUT.XXS)}
					>
						{drive.warnings.map((warning) => (
							<StorageLabel
								key={warning}
								tone={getWarningTone(warning)}
								text={t(`pages.infrastructure.storage.drives.warnings.${warning}`)}
							/>
						))}
					</Stack>
				),
		},
		{
			id: "details",
			content: "",
			hideMobileLabel: true,
			align: "right",
			render: ({ drive }) =>
				drive.serial_number ? (
					<Link
						component={RouterLink}
						to={getDrivePath(monitorId, drive.serial_number)}
						color={theme.palette.primary.main}
						fontWeight={500}
						onClick={(event) => event.stopPropagation()}
					>
						{t("pages.infrastructure.storage.drives.details")}
					</Link>
				) : null,
		},
	];

	const rows: DriveRow[] = drives.map((drive) => ({ id: drive.device, drive }));

	return (
		<Table
			headers={headers}
			data={rows}
			onRowClick={({ drive }) => {
				if (drive.serial_number) navigate(getDrivePath(monitorId, drive.serial_number));
			}}
		/>
	);
};

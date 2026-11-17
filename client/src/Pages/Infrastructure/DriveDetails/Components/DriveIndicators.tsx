import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/design-elements";
import { StorageSection } from "@/Pages/Infrastructure/Details/Components/Storage/StorageSection";

import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { DriveHistoryPoint, LatestDrive } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { formatNumber } from "@/Utils/FormatUtils";
import {
	getCounterTone,
	hasDriveValues,
	isDriveFailed,
	isNvme,
	parseTemperature,
	type StorageTone,
} from "@/Utils/StorageUtils";

const CARD_MIN_WIDTH = 200;

type CounterKey =
	| "reallocated_sectors"
	| "pending_sectors"
	| "offline_uncorrectable"
	| "media_errors";

const COUNTER_LABELS: Record<CounterKey, string> = {
	reallocated_sectors: "reallocated",
	pending_sectors: "pending",
	offline_uncorrectable: "uncorrectable",
	media_errors: "mediaErrors",
};

const IndicatorCard = ({
	label,
	value,
	note,
	tone,
}: {
	label: string;
	value: string;
	note: string;
	tone: StorageTone;
}) => {
	const theme = useTheme();
	const color = tone === "muted" ? theme.palette.text.primary : theme.palette[tone].main;
	const noteColor =
		tone === "muted" ? theme.palette.text.secondary : theme.palette[tone].main;

	return (
		<BaseBox
			display="flex"
			flexDirection="column"
			gap={theme.spacing(LAYOUT.XXS)}
			p={theme.spacing(LAYOUT.MD)}
			sx={{
				borderColor:
					tone === "muted"
						? theme.palette.divider
						: alpha(theme.palette[tone].main, 0.45),
			}}
		>
			<Typography
				fontSize={typographyLevels.s}
				color={theme.palette.text.secondary}
			>
				{label}
			</Typography>
			<Typography
				fontSize={typographyLevels.xxl}
				fontWeight={600}
				color={color}
			>
				{value}
			</Typography>
			<Typography color={noteColor}>{note}</Typography>
		</BaseBox>
	);
};

// Current counters and temperature, each compared with the start of the selected range
export const DriveIndicators = ({
	drive,
	points,
}: {
	drive: LatestDrive;
	points: DriveHistoryPoint[];
}) => {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const locale = i18n.resolvedLanguage ?? "en";
	const failed = isDriveFailed(drive);
	const showValues = hasDriveValues(drive);
	const notReported = t("pages.infrastructure.drive.indicators.notReported");

	const counterKeys: CounterKey[] = isNvme(drive)
		? ["media_errors"]
		: ["reallocated_sectors", "pending_sectors", "offline_uncorrectable"];

	const counterCard = (key: CounterKey) => {
		const label = t(`pages.infrastructure.drive.indicators.${COUNTER_LABELS[key]}`);
		const value = showValues ? drive[key] : null;
		if (value === null || value === undefined) {
			return (
				<IndicatorCard
					key={key}
					label={label}
					value={notReported}
					note=""
					tone="muted"
				/>
			);
		}
		const first = points.find((point) => point[key] !== null)?.[key] ?? null;
		const tone = getCounterTone(value, failed);
		let note: string;
		if (first === null) note = t("pages.infrastructure.drive.indicators.noHistory");
		else if (value > first) {
			note = t("pages.infrastructure.drive.indicators.upFrom", {
				value: formatNumber(first, locale),
			});
		} else note = t("pages.infrastructure.drive.indicators.unchanged");
		return (
			<IndicatorCard
				key={key}
				label={label}
				value={formatNumber(value, locale)}
				note={note}
				tone={tone}
			/>
		);
	};

	const temperatures = points
		.map((point) => point.temperature)
		.filter((value): value is number => value !== null);
	const temperature = showValues ? parseTemperature(drive.temperature) : null;
	const temperatureNote =
		temperatures.length === 0
			? t("pages.infrastructure.drive.indicators.noHistory")
			: t("pages.infrastructure.drive.indicators.temperatureRange", {
					min: Math.round(Math.min(...temperatures)),
					max: Math.round(Math.max(...temperatures)),
				});

	return (
		<StorageSection title={t("pages.infrastructure.drive.indicators.title")}>
			<Box
				display="grid"
				gridTemplateColumns={`repeat(auto-fit, minmax(min(${CARD_MIN_WIDTH}px, 100%), 1fr))`}
				gap={theme.spacing(LAYOUT.MD)}
			>
				{counterKeys.map(counterCard)}
				{isNvme(drive) && (
					<IndicatorCard
						label={t("pages.infrastructure.drive.indicators.wear")}
						value={(showValues && drive.percentage_used) || notReported}
						note=""
						tone="muted"
					/>
				)}
				<IndicatorCard
					label={t("pages.infrastructure.drive.indicators.temperature")}
					value={
						temperature === null
							? notReported
							: t("pages.infrastructure.storage.drives.celsius", { value: temperature })
					}
					note={temperatureNote}
					tone="muted"
				/>
			</Box>
		</StorageSection>
	);
};

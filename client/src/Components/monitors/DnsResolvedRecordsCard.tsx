import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BaseBox } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { DnsResolutionSnapshot, DnsRecordType } from "@/Types/Monitor";
import type { RootState } from "@/Types/state";

interface Props {
	resolution: DnsResolutionSnapshot;
}

const formatRecord = (recordType: DnsRecordType, record: unknown): string => {
	if (typeof record === "string") return record;
	if (recordType === "MX" && record && typeof record === "object") {
		const mx = record as { exchange: string; priority: number };
		return `${mx.priority} ${mx.exchange}`;
	}
	if (recordType === "TXT" && Array.isArray(record)) {
		return (record as string[]).join("");
	}
	return JSON.stringify(record);
};

const toRecordList = (recordType: DnsRecordType, results: unknown): string[] =>
	Array.isArray(results) ? results.map((r) => formatRecord(recordType, r)) : [];

export const DnsResolvedRecordsCard = ({ resolution }: Props) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	const records = toRecordList(resolution.recordType, resolution.results);
	const resolvedAtFormatted = formatDateWithTz(
		resolution.resolvedAt,
		"ddd, MMM D, YYYY, HH:mm",
		uiTimezone
	);

	const meta: { label: string; value: string }[] = [
		{ label: t("pages.uptime.details.dns.recordType"), value: resolution.recordType },
		{ label: t("pages.uptime.details.dns.dnsServer"), value: resolution.dnsServer },
		{ label: t("pages.uptime.details.dns.hostname"), value: resolution.hostname },
	];

	return (
		<BaseBox padding={theme.spacing(LAYOUT.LG)}>
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="baseline"
					gap={theme.spacing(LAYOUT.MD)}
					flexWrap="wrap"
				>
					<Typography variant="h2">{t("pages.uptime.details.dns.title")}</Typography>
					<Stack
						direction="row"
						gap={theme.spacing(LAYOUT.SM)}
						alignItems="baseline"
					>
						{!resolution.matched && (
							<Typography
								variant="body2"
								color={theme.palette.error.main}
							>
								{t("pages.uptime.details.dns.notMatched")}
							</Typography>
						)}
						<Typography
							variant="body2"
							color={theme.palette.text.secondary}
						>
							{t("pages.uptime.details.dns.resolvedAt", { time: resolvedAtFormatted })}
						</Typography>
					</Stack>
				</Stack>

				<Stack
					direction="row"
					gap={theme.spacing(LAYOUT.LG)}
					flexWrap="wrap"
				>
					{meta.map(({ label, value }) => (
						<Stack key={label}>
							<Typography
								variant="caption"
								color={theme.palette.text.secondary}
							>
								{label}
							</Typography>
							<Typography variant="body1">{value}</Typography>
						</Stack>
					))}
				</Stack>

				<Stack gap={theme.spacing(LAYOUT.XXS)}>
					<Typography
						variant="caption"
						color={theme.palette.text.secondary}
					>
						{t("pages.uptime.details.dns.records", { count: records.length })}
					</Typography>
					{records.length === 0 ? (
						<Typography
							variant="body2"
							color={theme.palette.text.secondary}
							fontStyle="italic"
						>
							{t("pages.uptime.details.dns.noRecords")}
						</Typography>
					) : (
						<Stack
							component="ul"
							gap={theme.spacing(LAYOUT.XXS)}
							p={0}
							m={0}
							sx={{ listStyle: "none" }}
						>
							{records.map((record, idx) => (
								<Typography
									key={idx}
									component="li"
									variant="body2"
									fontFamily="monospace"
								>
									{record}
								</Typography>
							))}
						</Stack>
					)}
				</Stack>
			</Stack>
		</BaseBox>
	);
};

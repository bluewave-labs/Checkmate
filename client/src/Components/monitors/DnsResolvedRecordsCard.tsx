import { useMemo } from "react";
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

const toRecordList = (recordType: DnsRecordType, results: unknown): string[] => {
	if (!Array.isArray(results)) return [];
	return (results as unknown[]).map((r) => formatRecord(recordType, r));
};

export const DnsResolvedRecordsCard = ({ resolution }: Props) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	const records = useMemo(
		() => toRecordList(resolution.recordType, resolution.results),
		[resolution.recordType, resolution.results]
	);

	const resolvedAtFormatted = formatDateWithTz(
		resolution.resolvedAt,
		"ddd, MMM D, YYYY, HH:mm",
		uiTimezone
	);

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
					<Typography
						variant="body2"
						color={theme.palette.text.secondary}
					>
						{t("pages.uptime.details.dns.resolvedAt", { time: resolvedAtFormatted })}
					</Typography>
				</Stack>

				<Stack
					direction="row"
					gap={theme.spacing(LAYOUT.LG)}
					flexWrap="wrap"
				>
					<Stack>
						<Typography
							variant="caption"
							color={theme.palette.text.secondary}
						>
							{t("pages.uptime.details.dns.recordType")}
						</Typography>
						<Typography variant="body1">{resolution.recordType}</Typography>
					</Stack>
					<Stack>
						<Typography
							variant="caption"
							color={theme.palette.text.secondary}
						>
							{t("pages.uptime.details.dns.dnsServer")}
						</Typography>
						<Typography variant="body1">{resolution.dnsServer}</Typography>
					</Stack>
					<Stack>
						<Typography
							variant="caption"
							color={theme.palette.text.secondary}
						>
							{t("pages.uptime.details.dns.hostname")}
						</Typography>
						<Typography variant="body1">{resolution.hostname}</Typography>
					</Stack>
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
							sx={{ listStyle: "none", padding: 0, margin: 0 }}
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

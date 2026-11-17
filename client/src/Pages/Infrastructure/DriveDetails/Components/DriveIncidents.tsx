import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { BaseBox, ValueLabel } from "@/Components/design-elements";
import { StorageSection } from "@/Pages/Infrastructure/Details/Components/Storage/StorageSection";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import { useFormatDate } from "@/Hooks/useFormatDate";
import type { StorageIncidentEvent } from "@/Types/Incident";
import { LAYOUT } from "@/Utils/Theme/constants";

const TIME_WIDTH = 160;

// Storage alerts about this drive, and about the arrays it belongs to, from the monitor's incidents. Newest first.
export const DriveIncidents = ({
	monitorId,
	serial,
	arrayDevices,
}: {
	monitorId: string;
	serial: string;
	arrayDevices: string[];
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const formatDate = useFormatDate();

	// The key is a string, so a new arrayDevices array with the same devices does not refetch
	const params = new URLSearchParams({
		monitorId,
		subjects: [serial, ...arrayDevices].join(","),
	});
	const eventsUrl = `/incidents/team/storage?${params.toString()}`;

	const { data: events, error } = useGet<StorageIncidentEvent[]>(
		eventsUrl,
		{},
		{ refreshInterval: 30000, keepPreviousData: true }
	);

	const describe = (event: StorageIncidentEvent) =>
		t(`pages.infrastructure.drive.incidents.events.${event.reason}`, {
			subject: event.subject,
			detail: event.detail,
		});

	const renderBody = () => {
		if (error) {
			return (
				<Typography color={theme.palette.text.secondary}>
					{t("pages.infrastructure.drive.incidents.error")}
				</Typography>
			);
		}
		if (!events) return null;
		if (events.length === 0) {
			return (
				<Typography color={theme.palette.text.secondary}>
					{t("pages.infrastructure.drive.incidents.none")}
				</Typography>
			);
		}
		return (
			<Stack
				component="ul"
				m={0}
				p={0}
				sx={{ listStyle: "none" }}
			>
				{events.map((event, index) => (
					<Stack
						component="li"
						key={`${event.incidentId}-${event.subject}-${event.reason}-${event.at}`}
						direction="row"
						flexWrap="wrap"
						alignItems="center"
						gap={theme.spacing(LAYOUT.XL)}
						py={theme.spacing(LAYOUT.LG)}
						borderTop={index > 0 ? `1px solid ${theme.palette.divider}` : "none"}
					>
						<Typography
							flex={`0 0 ${TIME_WIDTH}px`}
							color={theme.palette.text.secondary}
						>
							{formatDate(event.at, "dateTimeShort")}
						</Typography>
						<Typography flex="1 1 320px">{describe(event)}</Typography>
						<ValueLabel
							value={event.incidentActive ? "negative" : "positive"}
							text={
								event.incidentActive
									? t("pages.incidents.table.status.active")
									: t("pages.incidents.table.status.resolved")
							}
						/>
					</Stack>
				))}
			</Stack>
		);
	};

	return (
		<StorageSection
			title={t("pages.infrastructure.drive.incidents.title")}
			action={
				<Link
					component={RouterLink}
					to={`/incidents/${monitorId}`}
					color={theme.palette.primary.main}
				>
					{t("pages.infrastructure.drive.incidents.openAll")}
				</Link>
			}
		>
			<BaseBox p={theme.spacing(LAYOUT.MD)}>{renderBody()}</BaseBox>
		</StorageSection>
	);
};

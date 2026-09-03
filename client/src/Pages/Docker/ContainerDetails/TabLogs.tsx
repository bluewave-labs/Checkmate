// Components
import Stack from "@mui/material/Stack";
import { BaseBox } from "@/Components/design-elements";
import Typography from "@mui/material/Typography";

// Types
import type { DockerContainerLogsResponse } from "@/Types/Monitor";

// Hooks
import { useGet } from "@/Hooks/UseApi";
import { useState, useEffect, useMemo } from "react";
import type { DockerLog } from "@/Types/Check";
import { useSelector } from "react-redux";

// Util
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { flattenDockerLogs } from "@/Utils/MonitorUtils";
import { Box } from "@mui/material";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { RootState } from "@/store";

interface TabLogsProps {
	monitorId?: string;
	containerName?: string;
}

export const TabLogs = ({ monitorId, containerName }: TabLogsProps) => {
	// State
	const [olderLogs, setOlderLogs] = useState<DockerLog[]>([]);
	const [olderCursor, setOlderCursor] = useState<string | null | undefined>(undefined); // undefined -> no older requested, string -> cursor, null -> no more data
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [odlerError, setOlderError] = useState<unknown>(null);

	const baseLogsUrl =
		monitorId && containerName
			? `/monitors/docker/details/${encodeURIComponent(monitorId)}/containers/${encodeURIComponent(containerName)}/logs`
			: null;

	const {
		data: head,
		isLoading,
		isValidating,
		error: headError,
		refetch,
	} = useGet<DockerContainerLogsResponse>(
		baseLogsUrl,
		{},
		{
			refreshInterval: 10_000,
			keepPreviousData: true,
			revalidateOnFocus: true,
		}
	);

	const rows = useMemo(() => flattenDockerLogs(head?.logs ?? []), [head?.logs]);
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	return (
		<Stack gap={LAYOUT.MD}>
			<Stack direction="row">
				<Typography>{`${rows.length} recent lines`}</Typography>
				{isValidating && "Refreshing..."}
			</Stack>
			<BaseBox
				minHeight={240}
				maxHeight="60vh"
				overflow={"auto"}
				padding={LAYOUT.MD}
			>
				{[...rows].reverse().map((row) => {
					return (
						<Box key={row.key}>
							<Box
								display="grid"
								gridTemplateColumns={{
									xs: "1fr",
									sm: "150px 56px minmax(0, 1fr)",
								}}
							>
								<Typography
									component="span"
									color="text.secondary"
								>
									{formatDateWithTz(row.ts, "MMM D HH:mm:ss", uiTimezone)}
								</Typography>

								<Typography
									component="span"
									color={row.stream === "stderr" ? "error.main" : "text.secondary"}
								>
									{row.stream}
								</Typography>

								<Typography
									component="span"
									color="text.primary"
									whiteSpace="pre-wrap"
								>
									{row.text}
								</Typography>
							</Box>
							{row.gapBefore && (
								<Stack
									role="separator"
									direction="row"
									alignItems="center"
								>
									<Box
										flex={1}
										borderTop={1}
										borderColor="divider"
									/>
									<Typography
										variant="caption"
										color="warning.main"
									>
										{"Some lines were skipped between checks"}
									</Typography>
									<Box
										flex={1}
										borderTop={1}
										borderColor="divider"
									/>
								</Stack>
							)}
						</Box>
					);
				})}
			</BaseBox>
		</Stack>
	);
};

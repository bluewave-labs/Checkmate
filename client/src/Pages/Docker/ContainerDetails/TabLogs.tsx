// Components
import Stack from "@mui/material/Stack";
import { BaseBox } from "@/Components/design-elements";
import { HeaderLogs } from "@/Pages/Docker/ContainerDetails/Components/HeaderLogs";

// Types
import type { DockerContainerLogsResponse } from "@/Types/Monitor";

// Hooks
import { useGet } from "@/Hooks/UseApi";
import {
	useState,
	useEffect,
	useLayoutEffect,
	useMemo,
	Fragment,
	useRef,
	useCallback,
} from "react";
import type { DockerLog } from "@/Types/Check";
import { useTheme } from "@mui/material";
// Util
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { flattenDockerLogs } from "@/Utils/MonitorUtils";
import { RowLog } from "@/Pages/Docker/ContainerDetails/Components/RowLog";

interface TabLogsProps {
	monitorId?: string;
	containerName?: string;
}

const SCROLL_PIN_THRESHOLD_PX = 8;
const isScrolledToBottom = (el: HTMLElement) =>
	el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_PIN_THRESHOLD_PX;

export const TabLogs = ({ monitorId, containerName }: TabLogsProps) => {
	const theme = useTheme();

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

	const logBoxRef = useRef<HTMLDivElement>(null);
	const pinnedToBottom = useRef(true);

	// Always pin to bottom when container/monitor changes
	useLayoutEffect(() => {
		pinnedToBottom.current = true;
	}, [monitorId, containerName]);

	// New log rows
	useLayoutEffect(() => {
		const el = logBoxRef.current;
		if (!el || !pinnedToBottom.current) return;
		el.scrollTop = el.scrollHeight;
	}, [rows]);

	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		pinnedToBottom.current = isScrolledToBottom(event.currentTarget);
	}, []);

	return (
		<Stack gap={LAYOUT.MD}>
			<HeaderLogs
				lines={rows.length}
				isValidating={isValidating}
			/>
			<BaseBox
				ref={logBoxRef}
				onScroll={handleScroll}
				minHeight={240}
				maxHeight="50vh"
				overflow={"auto"}
				padding={LAYOUT.MD}
			>
				{rows.map((row) => {
					return (
						<RowLog
							key={row.key}
							row={row}
						/>
					);
				})}
			</BaseBox>
		</Stack>
	);
};

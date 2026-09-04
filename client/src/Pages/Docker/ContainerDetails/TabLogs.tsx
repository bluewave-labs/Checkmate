// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { HeaderLogs } from "@/Pages/Docker/ContainerDetails/Components/HeaderLogs";
import { RowLog } from "@/Pages/Docker/ContainerDetails/Components/RowLog";

// Types
import type { DockerContainerLogsResponse } from "@/Types/Monitor";
import type { DockerLog } from "@/Types/Check";
import type { ApiResponse } from "@/Hooks/UseApi";

// Hooks
import {
	useState,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useCallback,
} from "react";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useToast } from "@/Hooks/UseToast";

// Utils
import { get } from "@/Utils/ApiClient";
import { LAYOUT } from "@/Utils/Theme/constants";
import { flattenDockerLogs } from "@/Utils/MonitorUtils";

interface TabLogsProps {
	monitorId?: string;
	containerName?: string;
}

const SCROLL_PIN_THRESHOLD_PX = 8;
const TAIL_POLL_MS = 10_000;

const isScrolledToBottom = (el: HTMLElement) =>
	el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_PIN_THRESHOLD_PX;

const fetchLogs = async (url: string, params: { before?: string; after?: string }) => {
	const res = await get<ApiResponse<DockerContainerLogsResponse>>(url, { params });
	return res.data.data;
};

export const TabLogs = ({ monitorId, containerName }: TabLogsProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { toastError } = useToast();

	// logs is newest-first, matching the API and what flattenDockerLogs expects.
	const [logs, setLogs] = useState<DockerLog[]>([]);
	const [olderExhausted, setOlderExhausted] = useState(false);
	const [loadingInitial, setLoadingInitial] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

	const logsUrl =
		monitorId && containerName
			? `/monitors/docker/details/${encodeURIComponent(monitorId)}/containers/${encodeURIComponent(containerName)}/logs`
			: null;

	const newestCursor = logs[0]?.checkedAt;
	const oldestCursor = logs[logs.length - 1]?.checkedAt;

	// Initial page. Resets everything when the container changes.
	useEffect(() => {
		setLogs([]);
		setOlderExhausted(false);
		if (!logsUrl) return;
		let cancelled = false;
		setLoadingInitial(true);
		fetchLogs(logsUrl, {})
			.then((page) => {
				if (cancelled) return;
				setLogs(page.logs);
				setOlderExhausted(page.nextCursor === null);
				setLastUpdatedAt(Date.now());
			})
			.catch(() => {
				if (cancelled) return;
				toastError(t("pages.docker.container.logs.loadError"));
			})
			.finally(() => {
				if (!cancelled) setLoadingInitial(false);
			});
		return () => {
			cancelled = true;
		};
	}, [logsUrl, t, toastError]);

	const newestCursorRef = useRef(newestCursor);
	newestCursorRef.current = newestCursor;

	useEffect(() => {
		if (!logsUrl) return;
		let inFlight = false;
		const tick = async () => {
			if (inFlight || document.hidden) return;
			inFlight = true;
			try {
				const cursor = newestCursorRef.current;
				const page = await fetchLogs(logsUrl, cursor ? { after: cursor } : {});
				if (page.logs.length > 0) setLogs((prev) => [...page.logs, ...prev]);
				setLastUpdatedAt(Date.now());
			} catch (err: unknown) {
				console.error(err);
			} finally {
				inFlight = false;
			}
		};
		const id = window.setInterval(tick, TAIL_POLL_MS);
		document.addEventListener("visibilitychange", tick);
		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", tick);
		};
	}, [logsUrl]);

	const rows = useMemo(() => flattenDockerLogs(logs), [logs]);

	const logBoxRef = useRef<HTMLDivElement>(null);
	const pinnedToBottom = useRef(true);
	const prependAnchor = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

	// Always pin to bottom when container/monitor changes
	useLayoutEffect(() => {
		pinnedToBottom.current = true;
	}, [monitorId, containerName]);

	// Rows changed: restore position after a prepend, otherwise honour the pin
	useLayoutEffect(() => {
		const el = logBoxRef.current;
		if (!el) return;
		const anchor = prependAnchor.current;
		if (anchor) {
			prependAnchor.current = null;
			el.scrollTop = el.scrollHeight - anchor.scrollHeight + anchor.scrollTop;
			return;
		}
		if (pinnedToBottom.current) el.scrollTop = el.scrollHeight;
	}, [rows]);

	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		pinnedToBottom.current = isScrolledToBottom(event.currentTarget);
	}, []);

	const loadOlder = useCallback(async () => {
		if (!logsUrl || !oldestCursor || loadingOlder) return;
		setLoadingOlder(true);
		try {
			const page = await fetchLogs(logsUrl, { before: oldestCursor });
			const el = logBoxRef.current;
			if (el)
				prependAnchor.current = {
					scrollHeight: el.scrollHeight,
					scrollTop: el.scrollTop,
				};
			setLogs((prev) => [...prev, ...page.logs]);
			setOlderExhausted(page.nextCursor === null);
		} catch {
			toastError(t("pages.docker.container.logs.loadOlderError"));
		} finally {
			setLoadingOlder(false);
		}
	}, [logsUrl, oldestCursor, loadingOlder, t, toastError]);

	return (
		<Stack gap={LAYOUT.MD}>
			<HeaderLogs
				lines={rows.length}
				loading={loadingInitial}
				lastUpdatedAt={lastUpdatedAt}
			/>
			<BaseBox
				ref={logBoxRef}
				onScroll={handleScroll}
				minHeight={240}
				maxHeight="50vh"
				overflow="auto"
				padding={LAYOUT.MD}
				sx={{ overflowAnchor: "none" }}
			>
				{rows.length > 0 && (
					<Stack
						direction="row"
						justifyContent="center"
						pb={LAYOUT.MD}
					>
						{olderExhausted ? (
							<Typography color={theme.palette.text.secondary}>
								{t("pages.docker.container.logs.noOlder")}
							</Typography>
						) : (
							<Button
								variant="contained"
								disabled={loadingOlder}
								onClick={loadOlder}
							>
								{loadingOlder
									? t("pages.docker.container.logs.loadingOlder")
									: t("pages.docker.container.logs.loadOlder")}
							</Button>
						)}
					</Stack>
				)}
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

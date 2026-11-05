import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import { BasePage } from "@/Components/design-elements/BasePage";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { setDashboardCardOrder, setDashboardHiddenCards } from "@/Features/UI/uiSlice";
import { useGet } from "@/Hooks/UseApi";
import type { DashboardResponse } from "@/Types/Dashboard";
import type { RootState, AppDispatch } from "@/store";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { CurrentlyDownCard } from "@/Pages/Dashboard/components/cards/CurrentlyDownCard";
import { UptimeCard } from "@/Pages/Dashboard/components/cards/UptimeCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";
import { EditCardsModal } from "@/Pages/Dashboard/components/EditCardsModal";
import { SortableCard } from "@/Pages/Dashboard/components/SortableCard";
import { type DashboardCardKey, dashboardCardKeys } from "@/Types/Dashboard";
import { DiagnosticCard } from "@/Pages/Dashboard/components/cards/DiagnosticCard";
import { QueueCard } from "@/Pages/Dashboard/components/cards/QueueCard";
import { moveVisibleCard, normalizeCardOrder } from "@/Utils/DashboardUtils";

import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const [editOpen, setEditOpen] = useState(false);
	const hiddenCardsList = useSelector(
		(state: RootState) => state.ui.dashboardHiddenCards
	);

	const order = useSelector((state: RootState) => state.ui.dashboardUptimeOrder);

	const {
		data: dashboard,
		isLoading,
		error,
	} = useGet<DashboardResponse>(
		`/monitors/team/dashboard?order=${order}`,
		{},
		{ refreshInterval: 30000, keepPreviousData: true }
	);

	const cardComponents: Record<DashboardCardKey, ReactNode> = {
		monitorStatus: <MonitorStatusCard summary={dashboard?.summary ?? null} />,
		currentlyDown: (
			<CurrentlyDownCard
				monitors={dashboard?.down ?? []}
				total={dashboard?.summary.downMonitors ?? 0}
			/>
		),
		uptime: <UptimeCard monitors={dashboard?.uptime ?? []} />,
		monitorsByType: <MonitorsByTypeCard monitorsByType={dashboard?.byType ?? []} />,
		diagnostic: <DiagnosticCard />,
		queue: <QueueCard />,
	};

	const [arranging, setArranging] = useState(false);
	const isDraggingRef = useRef(false);

	useEffect(() => {
		if (!arranging) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isDraggingRef.current) {
				setArranging(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [arranging]);
	const savedOrder = useSelector((state: RootState) => state.ui.dashboardCardOrder);
	const cardOrder = useMemo(() => normalizeCardOrder(savedOrder), [savedOrder]);
	const hiddenCards = useMemo(() => new Set(hiddenCardsList), [hiddenCardsList]);
	const orderedVisibleKeys = useMemo(
		() => cardOrder.filter((key) => !hiddenCards.has(key)),
		[cardOrder, hiddenCards]
	);
	const visibleCards = useMemo(() => new Set(orderedVisibleKeys), [orderedVisibleKeys]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		isDraggingRef.current = false;
		if (!over || active.id === over.id) return;
		const next = moveVisibleCard(
			cardOrder,
			hiddenCards,
			active.id as DashboardCardKey,
			over.id as DashboardCardKey
		);
		dispatch(setDashboardCardOrder(next));
	};

	return (
		<BasePage
			headerKey="dashboard"
			loading={isLoading && !dashboard}
			error={!!error && !dashboard}
		>
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<Stack
					direction="row"
					justifyContent="flex-end"
					gap={theme.spacing(LAYOUT.SM)}
				>
					{arranging ? (
						<>
							<Button
								variant="outlined"
								size="small"
								onClick={() => dispatch(setDashboardCardOrder([...dashboardCardKeys]))}
							>
								{t("pages.dashboard.arrange.reset")}
							</Button>
							<Button
								variant="contained"
								size="small"
								onClick={() => setArranging(false)}
							>
								{t("pages.dashboard.arrange.done")}
							</Button>
						</>
					) : (
						<>
							{orderedVisibleKeys.length > 1 && (
								<Button
									variant="outlined"
									size="small"
									onClick={() => setArranging(true)}
								>
									{t("pages.dashboard.arrange.start")}
								</Button>
							)}
							<Button
								variant="outlined"
								size="small"
								onClick={() => setEditOpen(true)}
							>
								{t("pages.dashboard.editCards")}
							</Button>
						</>
					)}
				</Stack>

				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={() => {
						isDraggingRef.current = true;
					}}
					onDragCancel={() => {
						isDraggingRef.current = false;
					}}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={orderedVisibleKeys}
						strategy={rectSortingStrategy}
					>
						<Grid
							container
							spacing={LAYOUT.MD}
						>
							{orderedVisibleKeys.map((key) => (
								<SortableCard
									key={key}
									cardKey={key}
									arranging={arranging}
								>
									{cardComponents[key]}
								</SortableCard>
							))}
						</Grid>
					</SortableContext>
				</DndContext>
			</Stack>

			<EditCardsModal
				open={editOpen}
				visibleCards={visibleCards}
				onClose={() => setEditOpen(false)}
				onSave={(next) => {
					dispatch(
						setDashboardHiddenCards(dashboardCardKeys.filter((key) => !next.has(key)))
					);
					setEditOpen(false);
				}}
			/>
		</BasePage>
	);
};

export default Dashboard;

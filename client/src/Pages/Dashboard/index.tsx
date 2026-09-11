import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { LayoutGrid } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
	closestCenter,
} from "@dnd-kit/core";
import type {
	DragStartEvent,
	DragEndEvent,
	DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import type { SortingStrategy } from "@dnd-kit/sortable";

import { BasePage } from "@/Components/design-elements/BasePage";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { RootState } from "@/Types/state";
import { setDashboardCardOrder } from "@/Features/UI/uiSlice";

import {
	DASHBOARD_CARD_IDS,
	defaultVisibleCards,
	type DashboardCardId,
} from "@/Pages/Dashboard/dashboardCards";
import { EditCardsModal } from "@/Pages/Dashboard/components/EditCardsModal";
import { useDashboardData } from "@/Pages/Dashboard/hooks/useDashboardData";
import { SortableCard } from "@/Pages/Dashboard/components/SortableCard";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { CurrentlyDownCard } from "@/Pages/Dashboard/components/cards/CurrentlyDownCard";
import { SlowestMonitorsCard } from "@/Pages/Dashboard/components/cards/SlowestMonitorsCard";
import { LowestUptimeCard } from "@/Pages/Dashboard/components/cards/LowestUptimeCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";
import { MonitorsByGroupCard } from "@/Pages/Dashboard/components/cards/MonitorsByGroupCard";
import { StubCard } from "@/Pages/Dashboard/components/cards/StubCard";

// No displacement transforms during drag — only the DragOverlay moves
const noAnimationStrategy: SortingStrategy = () => null;

const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const [modalOpen, setModalOpen] = useState(false);
	const [activeId, setActiveId] = useState<DashboardCardId | null>(null);

	const visibility = useSelector(
		(state: RootState) => state.ui.dashboardCards ?? defaultVisibleCards
	);
	const cardOrder = useSelector(
		(state: RootState) => state.ui.dashboardCardOrder ?? [...DASHBOARD_CARD_IDS]
	);

	const {
		isLoading,
		error,
		summary,
		downMonitors,
		slowestMonitors,
		lowestUptimeMonitors,
		monitorsByType,
		monitorsByGroup,
	} = useDashboardData();

	const visibleCards = cardOrder.filter((id) => visibility[id]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as DashboardCardId);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveId(null);
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = visibleCards.indexOf(active.id as DashboardCardId);
		const newIndex = visibleCards.indexOf(over.id as DashboardCardId);
		if (oldIndex === -1 || newIndex === -1) return;

		const newVisible = arrayMove(visibleCards, oldIndex, newIndex);
		let vi = 0;
		const newFullOrder = cardOrder.map((id) => (visibility[id] ? newVisible[vi++] : id));
		dispatch(setDashboardCardOrder(newFullOrder));
	};

	const renderCardContent = (
		id: DashboardCardId,
		dragHandleProps?: DraggableSyntheticListeners
	) => {
		switch (id) {
			case "monitorStatus":
				return (
					<MonitorStatusCard
						summary={summary}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
			case "currentlyDown":
				return (
					<CurrentlyDownCard
						downMonitors={downMonitors}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
			case "slowestMonitors":
				return (
					<SlowestMonitorsCard
						slowestMonitors={slowestMonitors}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
			case "lowestUptime":
				return (
					<LowestUptimeCard
						lowestUptimeMonitors={lowestUptimeMonitors}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
			case "monitorsByType":
				return (
					<MonitorsByTypeCard
						monitorsByType={monitorsByType}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
			case "monitorsByGroup":
				return (
					<MonitorsByGroupCard
						monitorsByGroup={monitorsByGroup}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
			default:
				return (
					<StubCard
						cardId={id}
						isLoading={isLoading}
						error={error}
						dragHandleProps={dragHandleProps}
					/>
				);
		}
	};

	return (
		<BasePage headerKey="dashboard">
			<Stack
				direction="row"
				justifyContent="flex-end"
			>
				<Button
					variant="outlined"
					startIcon={<LayoutGrid size={16} />}
					onClick={() => setModalOpen(true)}
				>
					{t("pages.dashboard.editCards")}
				</Button>
			</Stack>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={visibleCards}
					strategy={noAnimationStrategy}
				>
					<Box
						display="grid"
						gridTemplateColumns={isSmall ? "1fr" : "1fr 1fr"}
						gap={theme.spacing(LAYOUT.MD)}
					>
						{visibleCards.map((id) => (
							<SortableCard
								key={id}
								id={id}
								isDragging={activeId === id}
							>
								{(listeners) => renderCardContent(id, listeners)}
							</SortableCard>
						))}
					</Box>
				</SortableContext>

				<DragOverlay>
					{activeId ? (
						<Box sx={{ opacity: 0.85, pointerEvents: "none" }}>
							{renderCardContent(activeId)}
						</Box>
					) : null}
				</DragOverlay>
			</DndContext>

			<EditCardsModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
			/>
		</BasePage>
	);
};

export default Dashboard;

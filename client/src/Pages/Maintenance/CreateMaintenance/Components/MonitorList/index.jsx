// Components
import { Stack, Typography } from "@mui/material";
import ReorderRoundedIcon from "@mui/icons-material/ReorderRounded";
import DeleteIcon from "@mui/icons-material/Delete";

// Utils
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@emotion/react";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
const MonitorListItem = ({
	monitor,
	innerRef,
	draggableProps,
	dragHandleProps,
	onDelete,
}) => {
	const theme = useTheme();
	return (
		<Stack
			direction={"row"}
			{...draggableProps}
			{...dragHandleProps}
			ref={innerRef}
			gap={theme.spacing(4)}
			margin={theme.spacing(4)}
			padding={theme.spacing(4)}
			borderRadius={theme.shape.borderRadius}
			alignItems={"center"}
			justifyContent={"start"}
			border={`1px solid ${theme.palette.primary.lowContrast}`}
		>
			<ReorderRoundedIcon />
			<Typography>{monitor.name}</Typography>
			<DeleteIcon
				sx={{ marginLeft: "auto" }}
				onClick={() => {
					onDelete(monitor);
				}}
			/>
		</Stack>
	);
};

const MonitorList = ({ selectedMonitors, setSelectedMonitors }) => {
	const onDelete = (monitorToDelete) => {
		const newMonitors = selectedMonitors.filter(
			(monitor) => monitor._id !== monitorToDelete._id
		);
		setSelectedMonitors(newMonitors);
	};
	const reorder = (list, startIndex, endIndex) => {
		const result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);

		return result;
	};

	const onDragEnd = (result) => {
		// dropped outside the list
		if (!result.destination) {
			return;
		}

		const reorderedMonitors = reorder(
			selectedMonitors,
			result.source.index,
			result.destination.index
		);

		setSelectedMonitors(reorderedMonitors);
	};

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable droppableId="droppable">
				{(provided, snapshot) => (
					<Stack
						{...provided.droppableProps}
						ref={provided.innerRef}
					>
						{selectedMonitors?.map((monitor, index) => (
							<Draggable
								key={monitor._id}
								draggableId={monitor._id}
								index={index}
							>
								{(provided, snapshot) => (
									<MonitorListItem
										monitor={monitor}
										innerRef={provided.innerRef}
										draggableProps={provided.draggableProps}
										dragHandleProps={provided.dragHandleProps}
										onDelete={onDelete}
									/>
								)}
							</Draggable>
						))}
						{provided.placeholder}
					</Stack>
				)}
			</Droppable>
		</DragDropContext>
	);
};

export default MonitorList;

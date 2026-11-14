import { useMemo } from "react";
import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "@/Components/inputs";
import { typographyLevels } from "@/Utils/Theme/Palette";
import {
	BADGE,
	FOCUS_RING,
	GAP,
	ICON_SIZE,
	ICON_STROKE,
	LAYOUT,
	RADIUS,
	SELECTED_LIST,
} from "@/Utils/Theme/constants";

export interface MultiSelectOption {
	id: string | number;
	name: string;
}

// list: long names or ordering matters; chips: short values such as tags
export const MultiSelectDisplays = ["list", "chips"] as const;
export type MultiSelectDisplay = (typeof MultiSelectDisplays)[number];

interface FormMultiSelectFieldProps<T extends FieldValues, O extends MultiSelectOption> {
	name: FieldPath<T>;
	options: O[];
	fieldLabel?: string;
	placeholder?: string;
	description?: string;
	renderRow?: (option: O) => React.ReactNode;
	renderOptionContent?: (option: O) => React.ReactNode;
	sortable?: boolean;
	display?: MultiSelectDisplay;
}

export const FormMultiSelectField = <T extends FieldValues, O extends MultiSelectOption>({
	name,
	options,
	fieldLabel,
	placeholder,
	description,
	renderRow,
	renderOptionContent,
	sortable = false,
	display = "list",
}: FormMultiSelectFieldProps<T, O>) => {
	const { control } = useFormContext<T>();
	const theme = useTheme();
	const { t } = useTranslation();
	const optionsById = useMemo(
		() => new Map<O["id"], O>(options.map((o) => [o.id, o])),
		[options]
	);
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				const selectedIds: O["id"][] = field.value ?? [];
				const selected = selectedIds
					.map((id) => optionsById.get(id))
					.filter((o): o is O => o !== undefined);
				// Ids missing from options (e.g. excluded roles) are kept on every change
				const unresolved = selectedIds.filter((id) => !optionsById.has(id));

				const handleDragEnd = (result: DropResult) => {
					if (!result.destination) return;
					const reordered = selected.map((o) => o.id);
					const [moved] = reordered.splice(result.source.index, 1);
					reordered.splice(result.destination.index, 0, moved);
					field.onChange([...reordered, ...unresolved]);
				};

				const remove = (option: O) =>
					field.onChange(selectedIds.filter((id) => id !== option.id));
				const clear = () => field.onChange(unresolved);

				const removeButton = (option: O) => (
					<IconButton
						size="small"
						onClick={() => remove(option)}
						aria-label={t("common.buttons.removeItem", { item: option.name })}
						sx={{ color: theme.palette.neutral.icon }}
					>
						<X
							size={ICON_SIZE.SM}
							strokeWidth={ICON_STROKE}
						/>
					</IconButton>
				);

				const clearButton = (
					<Button
						variant="text"
						size="small"
						onClick={clear}
						sx={{ minWidth: 0, height: "auto", padding: 0 }}
					>
						{t("common.buttons.clear")}
					</Button>
				);

				const rowContent = (option: O) =>
					renderRow ? (
						renderRow(option)
					) : (
						<Typography
							flexGrow={1}
							minWidth={0}
							noWrap
						>
							{option.name}
						</Typography>
					);

				const listRow = (option: O, index: number, dragging = false) => (
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(LAYOUT.XS)}
						height={SELECTED_LIST.ROW_HEIGHT}
						paddingLeft={theme.spacing(LAYOUT.MD)}
						paddingRight={theme.spacing(LAYOUT.XXS)}
						borderTop={
							index > 0 ? `1px solid ${theme.palette.neutral.rowDivider}` : "none"
						}
						bgcolor={
							dragging
								? theme.palette.neutral.selectedGreen
								: theme.palette.background.paper
						}
						sx={{ "&:hover": { backgroundColor: theme.palette.neutral.hoverGreen } }}
					>
						{sortable && (
							<Box
								display="inline-flex"
								color={theme.palette.neutral.subdued}
							>
								<GripVertical
									size={ICON_SIZE.SM}
									strokeWidth={ICON_STROKE}
								/>
							</Box>
						)}
						{rowContent(option)}
						{removeButton(option)}
					</Stack>
				);

				const list = (
					<Box
						border={`1px solid ${theme.palette.divider}`}
						borderRadius={RADIUS.SM}
						overflow="hidden"
					>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
							height={SELECTED_LIST.HEADER_HEIGHT}
							paddingX={theme.spacing(LAYOUT.MD)}
							bgcolor={theme.palette.neutral.raised}
							borderBottom={`1px solid ${theme.palette.divider}`}
						>
							<Typography
								fontSize={typographyLevels.sm}
								color={theme.palette.text.secondary}
							>
								{t("components.multiSelect.selectedCount", { count: selected.length })}
							</Typography>
							{clearButton}
						</Stack>
						{sortable ? (
							<DragDropContext onDragEnd={handleDragEnd}>
								<Droppable droppableId={`${name}-list`}>
									{(provided) => (
										<Box
											{...provided.droppableProps}
											ref={provided.innerRef}
										>
											{selected.map((option, index) => (
												<Draggable
													key={option.id}
													draggableId={String(option.id)}
													index={index}
												>
													{(provided, snapshot) => (
														<Box
															ref={provided.innerRef}
															{...provided.draggableProps}
															{...provided.dragHandleProps}
															sx={{
																cursor: "grab",
																"&:active": { cursor: "grabbing" },
																"&:focus-visible": {
																	outline: `${FOCUS_RING.WIDTH}px solid ${theme.palette.primary.main}`,
																	outlineOffset: FOCUS_RING.INSET_OFFSET,
																},
															}}
														>
															{listRow(option, index, snapshot.isDragging)}
														</Box>
													)}
												</Draggable>
											))}
											{provided.placeholder}
										</Box>
									)}
								</Droppable>
							</DragDropContext>
						) : (
							selected.map((option, index) => (
								<Box key={option.id}>{listRow(option, index)}</Box>
							))
						)}
					</Box>
				);

				// Custom content (coloured tags) already looks like a chip, so no second frame
				const chip = (option: O) =>
					renderRow ? (
						<Stack
							key={option.id}
							direction="row"
							alignItems="center"
						>
							{renderRow(option)}
							{removeButton(option)}
						</Stack>
					) : (
						<Stack
							key={option.id}
							direction="row"
							alignItems="center"
							gap={theme.spacing(LAYOUT.XXS)}
							height={BADGE.HEIGHT}
							maxWidth="100%"
							paddingLeft={theme.spacing(LAYOUT.SM)}
							borderRadius={RADIUS.SM}
							border={`1px solid ${theme.palette.divider}`}
							bgcolor={theme.palette.neutral.raised}
						>
							<Typography
								fontSize={typographyLevels.sm}
								noWrap
							>
								{option.name}
							</Typography>
							{removeButton(option)}
						</Stack>
					);

				const chips = (
					<Stack
						direction="row"
						flexWrap="wrap"
						alignItems="center"
						gap={GAP.SELECTED}
					>
						{selected.map(chip)}
						{clearButton}
					</Stack>
				);

				return (
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Autocomplete
							multiple
							autoHighlight
							options={options}
							value={selected}
							getOptionLabel={(option) => option.name}
							isOptionEqualToValue={(option, value) => option.id === value.id}
							onChange={(_: unknown, newValue: O[]) => {
								field.onChange([...newValue.map((o) => o.id), ...unresolved]);
							}}
							fieldLabel={fieldLabel}
							placeholder={selected.length > 0 ? "" : placeholder}
							renderOptionContent={renderOptionContent}
							error={!!fieldState.error}
							helperText={fieldState.error?.message ?? ""}
						/>
						{description && (
							<Typography
								component="span"
								color={theme.palette.text.secondary}
								sx={{ opacity: 0.8 }}
							>
								{description}
							</Typography>
						)}
						{selected.length > 0 && (display === "chips" ? chips : list)}
					</Stack>
				);
			}}
		/>
	);
};

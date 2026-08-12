import { useMemo } from "react";
import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import { Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "@/Components/inputs";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";

export interface MultiSelectOption {
	id: string | number;
	name: string;
}

interface FormMultiSelectFieldProps<T extends FieldValues, O extends MultiSelectOption> {
	name: FieldPath<T>;
	options: O[];
	fieldLabel?: string;
	placeholder?: string;
	description?: string;
	renderRow?: (option: O) => React.ReactNode;
	renderOptionContent?: (option: O) => React.ReactNode;
	sortable?: boolean;
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

				const handleDragEnd = (result: DropResult) => {
					if (!result.destination) return;
					const reordered = selected.map((o) => o.id);
					const [moved] = reordered.splice(result.source.index, 1);
					reordered.splice(result.destination.index, 0, moved);
					const unresolved = selectedIds.filter((id) => !optionsById.has(id));
					field.onChange([...reordered, ...unresolved]);
				};

				const rowContent = (option: O) =>
					renderRow ? (
						renderRow(option)
					) : (
						<Typography flexGrow={1}>{option.name}</Typography>
					);

				const removeButton = (option: O) => (
					<IconButton
						size="small"
						onClick={() => {
							field.onChange(selectedIds.filter((id) => id !== option.id));
						}}
						aria-label={t("common.buttons.removeItem", { item: option.name })}
					>
						<Trash2 size={16} />
					</IconButton>
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
								// The Autocomplete only sees resolved options, so ids missing
								// from options must be re-appended or they'd be silently
								// dropped (e.g. a role excluded from the selectable list).
								const unresolved = selectedIds.filter((id) => !optionsById.has(id));
								field.onChange([...newValue.map((o) => o.id), ...unresolved]);
							}}
							fieldLabel={fieldLabel}
							placeholder={placeholder}
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
						{sortable
							? selected.length > 0 && (
									<DragDropContext onDragEnd={handleDragEnd}>
										<Droppable droppableId={`${name}-list`}>
											{(provided) => (
												<Stack
													{...provided.droppableProps}
													ref={provided.innerRef}
												>
													{selected.map((option, index) => (
														<Draggable
															key={option.id}
															draggableId={String(option.id)}
															index={index}
														>
															{(provided) => (
																<Stack
																	ref={provided.innerRef}
																	{...provided.draggableProps}
																	{...provided.dragHandleProps}
																	direction="row"
																	alignItems="center"
																	spacing={theme.spacing(LAYOUT.XS)}
																	padding={theme.spacing(LAYOUT.XS)}
																	marginTop={theme.spacing(SPACING.LG)}
																	borderRadius={1}
																	border={`1px solid ${theme.palette.divider}`}
																	sx={{
																		cursor: "grab",
																		"&:active": { cursor: "grabbing" },
																	}}
																>
																	<GripVertical size={20} />
																	{rowContent(option)}
																	{removeButton(option)}
																</Stack>
															)}
														</Draggable>
													))}
													{provided.placeholder}
												</Stack>
											)}
										</Droppable>
									</DragDropContext>
								)
							: selected.map((option, index) => (
									<Stack
										direction="row"
										alignItems="center"
										key={option.id}
										width="100%"
									>
										{rowContent(option)}
										{removeButton(option)}
										{index < selected.length - 1 && <Divider />}
									</Stack>
								))}
					</Stack>
				);
			}}
		/>
	);
};

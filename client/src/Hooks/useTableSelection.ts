import { useMemo, useCallback } from "react";

interface SelectableItem {
	id: string;
}

interface UseTableSelectionReturn {
	isAllSelected: boolean;
	isSomeSelected: boolean;
	handleSelectAll: (checked: boolean) => void;
	handleSelectRow: (itemId: string, checked: boolean) => void;
	isRowSelected: (itemId: string) => boolean;
}

export const useTableSelection = (
	items: SelectableItem[],
	selectedIds: string[],
	onSelectionChange?: (selected: string[]) => void
): UseTableSelectionReturn => {
	const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	const isAllSelected = useMemo(
		() =>
			items.length > 0 &&
			items.every((item) => selectedSet.has(item.id)) &&
			selectedIds.length >= items.length,
		[items, selectedSet, selectedIds.length]
	);

	const isSomeSelected = useMemo(
		() => selectedIds.length > 0 && !isAllSelected,
		[selectedIds.length, isAllSelected]
	);

	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (onSelectionChange) {
				if (checked) {
					const allIds = items.map((item) => item.id);
					onSelectionChange(allIds);
				} else {
					onSelectionChange([]);
				}
			}
		},
		[items, onSelectionChange]
	);

	const handleSelectRow = useCallback(
		(itemId: string, checked: boolean) => {
			if (onSelectionChange) {
				if (checked) {
					onSelectionChange([...selectedIds, itemId]);
				} else {
					onSelectionChange(selectedIds.filter((id) => id !== itemId));
				}
			}
		},
		[selectedIds, onSelectionChange]
	);

	const isRowSelected = useCallback(
		(itemId: string) => selectedSet.has(itemId),
		[selectedSet]
	);

	return {
		isAllSelected,
		isSomeSelected,
		handleSelectAll,
		handleSelectRow,
		isRowSelected,
	};
};

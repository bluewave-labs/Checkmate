import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import FilterHeader from "../../../../../Components/FilterHeader";
import { useMemo } from "react";
import { Box, Button } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useTranslation } from "react-i18next";

/**
 * Filter Component
 *
 * A high-level component that provides filtering options for status in Infrastructure Page.
 * It allows users to select multiple options for each filter and reset the filters.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string[]} props.selectedStatus - An array of selected status values.
 * @param {function} props.setSelectedStatus - A function to set the selected status values.
 * @param {function} props.setToFilterStatus - A function to set the filter status based on selected status values.
 * @param {function} props.handleReset - A function to reset all filters.
 *
 * @returns {JSX.Element} The rendered Filter component.
 */

const statusOptions = [
	{ value: "Up", label: "Up" },
	{ value: "Down", label: "Down" },
];

const Filter = ({
	selectedStatus,
	setSelectedStatus,
	setToFilterStatus,
	handleReset,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const handleStatusChange = (event) => {
		const selectedValues = event.target.value;
		setSelectedStatus(selectedValues.length > 0 ? selectedValues : undefined);

		if (selectedValues.length === 0 || selectedValues.length === 2) {
			setToFilterStatus(undefined);
		} else {
			setToFilterStatus(selectedValues[0] === "Up" ? "true" : "false");
		}
	};

	const isFilterActive = useMemo(() => {
		return (selectedStatus?.length ?? 0) > 0;
	}, [selectedStatus]);

	return (
		<Box>
			<FilterHeader
				header={t("status")}
				options={statusOptions}
				value={selectedStatus}
				onChange={handleStatusChange}
			/>
			<Button
				color={theme.palette.primary.contrastText}
				onClick={handleReset}
				variant="contained"
				endIcon={<ClearIcon />}
				sx={{
					visibility: isFilterActive ? "visible" : "hidden",
				}}
			>
				{t("reset")}
			</Button>
		</Box>
	);
};

Filter.propTypes = {
    selectedStatus: PropTypes.arrayOf(PropTypes.string),
    setSelectedStatus: PropTypes.func.isRequired,
    setToFilterStatus: PropTypes.func.isRequired,
    handleReset: PropTypes.func.isRequired,
};

export default Filter;

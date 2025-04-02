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
 * A high-level component that provides filtering options for type, status, and state.
 * It allows users to select multiple options for each filter and reset the filters.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string[]} props.selectedTypes - An array of selected type values.
 * @param {function} props.setSelectedTypes - A function to set the selected type values.
 * @param {string[]} props.selectedStatus - An array of selected status values.
 * @param {function} props.setSelectedStatus - A function to set the selected status values.
 * @param {string[]} props.selectedState - An array of selected state values.
 * @param {function} props.setSelectedState - A function to set the selected state values.
 * @param {function} props.setToFilterStatus - A function to set the filter status based on selected status values.
 * @param {function} props.setToFilterActive - A function to set the filter active state based on selected state values.
 * @param {function} props.handleReset - A function to reset all filters.
 *
 * @returns {JSX.Element} The rendered Filter component.
 */

const Filter = ({
	selectedTypes,
	setSelectedTypes,
	selectedStatus,
	setSelectedStatus,
	selectedState,
	setSelectedState,
	setToFilterStatus,
	setToFilterActive,
	handleReset,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const handleTypeChange = (event) => {
		const selectedValues = event.target.value;
		setSelectedTypes(selectedValues.length > 0 ? selectedValues : undefined);
	};

	const handleStatusChange = (event) => {
		const selectedValues = event.target.value;
		setSelectedStatus(selectedValues.length > 0 ? selectedValues : undefined);

		if (selectedValues.length === 0 || selectedValues.length === 2) {
			setToFilterStatus(null);
		} else {
			setToFilterStatus(selectedValues[0] === "Up" ? "true" : "false");
		}
	};

	const handleStateChange = (event) => {
		const selectedValues = event.target.value;
		setSelectedState(selectedValues);

		if (selectedValues.length === 0 || selectedValues.length === 2) {
			setToFilterActive(null);
		} else {
			setToFilterActive(selectedValues[0] === "Active" ? "true" : "false");
		}
	};

	const isFilterActive = useMemo(() => {
		return (
			(selectedTypes?.length ?? 0) > 0 ||
			(selectedState?.length ?? 0) > 0 ||
			(selectedStatus?.length ?? 0) > 0
		);
	}, [selectedState, selectedTypes, selectedStatus]);

	const typeOptions = [
		{ value: "http", label: "HTTP(S)" },
		{ value: "ping", label: "Ping" },
		{ value: "docker", label: "Docker" },
		{ value: "port", label: "Port" },
	];

	const statusOptions = [
		{ value: "Up", label: "Up" },
		{ value: "Down", label: "Down" },
	];

	const stateOptions = [
		{ value: "Active", label: "Active" },
		{ value: "Paused", label: "Paused" },
	];

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				ml: theme.spacing(4),
				gap: theme.spacing(2),
			}}
		>
			<FilterHeader
				header={t("type")}
				options={typeOptions}
				value={selectedTypes}
				onChange={handleTypeChange}
			/>
			<FilterHeader
				header={t("status")}
				options={statusOptions}
				value={selectedStatus}
				onChange={handleStatusChange}
			/>
			<FilterHeader
				header={t("state")}
				options={stateOptions}
				value={selectedState}
				onChange={handleStateChange}
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
	selectedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
	setSelectedTypes: PropTypes.func.isRequired,
	selectedStatus: PropTypes.arrayOf(PropTypes.string).isRequired,
	setSelectedStatus: PropTypes.func.isRequired,
	selectedState: PropTypes.arrayOf(PropTypes.string).isRequired,
	setSelectedState: PropTypes.func.isRequired,
	setToFilterStatus: PropTypes.func.isRequired,
	setToFilterActive: PropTypes.func.isRequired,
	handleReset: PropTypes.func.isRequired,
};

export default Filter;

import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import FilterHeader from "../../../../../Components/FilterHeader";
import { useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

const Filter = ({ selectedTypes, setSelectedTypes, setToFilterStatus, setToFilterActive }) => {
	const theme = useTheme();

	const [selectedState, setSelectedState] = useState([]);
	const [selectedStatus, setSelectedStatus] = useState([]);

	const handleTypeChange = (event) => {
		setSelectedTypes(event.target.value);
	};

	const handleStatusChange = (event) => {
		const selectedValues = event.target.value;
		setSelectedStatus(selectedValues);

		if (selectedValues.length === 0 || selectedValues.length === 2) {
			setToFilterStatus(null);
		} else {
			setToFilterStatus(selectedValues[0] === "Up" ? "true" : "false");
		}
	}

	const handleStateChange = (event) => {
		const selectedValues = event.target.value;
		setSelectedState(selectedValues);

		if (selectedValues.length === 0 || selectedValues.length === 2) {
			setToFilterActive(null);
		} else {
			setToFilterActive(selectedValues[0] === "Active" ? "true" : "false");
		}
	};

	const handleReset = () => {
		setSelectedState([]);
		setSelectedTypes([]);
		setSelectedStatus([]);
		setToFilterStatus(null);
		setToFilterActive(null);
	};

	const isFilterActive = useMemo(() => {
		return selectedTypes.length > 0 || selectedState.length > 0 || selectedStatus.length > 0;
	}, [selectedState, selectedTypes, selectedStatus]);

	const typeOptions = ["http", "ping", "docker", "port"];
	const statusOptions = ["Up", "Down"];
	const stateOptions = ["Active", "Paused"];

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				ml: theme.spacing(80),
				gap: theme.spacing(2),
			}}
		>
			<Button
				color={theme.palette.primary.contrastText}
				onClick={handleReset}
				variant="contained"
				endIcon={<ClearIcon />}
				sx={{
					"&:hover": {
						backgroundColor: theme.palette.primary.lowContrast,
					},
					visibility: isFilterActive ? "visible" : "hidden",
				}}
			>
				Reset
			</Button>
			<FilterHeader
				header="Type"
				options={typeOptions}
				value={selectedTypes}
				onChange={handleTypeChange}
			/>
			<FilterHeader 
				header="Status"
				options={statusOptions}
				value={selectedStatus}
				onChange={handleStatusChange}
			/>
			<FilterHeader
				header="State"
				options={stateOptions}
				value={selectedState}
				onChange={handleStateChange}
			/>
		</Box>
	);
};

Filter.propTypes = {
	selectedTypes: PropTypes.arrayOf(PropTypes.string),
	setSelectedTypes: PropTypes.func,
	setToFilterStatus: PropTypes.func,
	setToFilterActive: PropTypes.func,
};

export default Filter;

import PropTypes from "prop-types";
import Search from "../../../../../Components/Inputs/Search";
import { useState } from "react";
import ConfigRow from "../../../../../Components/ConfigRow";

/**
 * MonitorsConfig is a component that allows users to select and apply a maintenance window to a list of monitors.
 * It provides a search input to filter monitors and select multiple options. The selected monitors are passed
 * to the parent via the `onSelectMonitors` callback.
 *
 *
 * @component
 *
 * @param {Array} props.monitors - List of available monitors that can be selected.
 * @param {Array} props.selectedMonitors - List of monitors currently selected for applying the maintenance window.
 * @param {string} [props.error] - Optional error message that will be displayed if there's an error in monitor selection.
 * @param {boolean} props.isEditMode - A boolean flag indicating if the component is in edit mode (disabled search/input when true).
 * @param {Function} props.onSelectMonitors - Callback function that is invoked when monitors are selected or deselected.
 * @param {string} [props.secondaryLabel] - Optional label or description that provides additional context for the monitor search.
 */

const MonitorsConfig = ({
	monitors,
	selectedMonitors,
	error,
	isEditMode,
	onSelectMonitors,
	secondaryLabel,
}) => {
	const [search, setSearch] = useState("");
	const handleSearch = (value) => {
		setSearch(value);
	};

	return (
		<ConfigRow
			title="Monitors for maintenance"
			description="Select monitors to apply the maintenance window to. Use the search field to filter and choose multiple monitors."
		>
			<Search
				id={"monitors"}
				label="Add monitors"
				multiple={true}
				isAdorned={false}
				options={monitors || []}
				filteredBy="name"
				secondaryLabel={secondaryLabel}
				inputValue={search}
				value={selectedMonitors}
				handleInputChange={handleSearch}
				handleChange={onSelectMonitors}
				error={error}
				disabled={isEditMode}
			/>
		</ConfigRow>
	);
};

MonitorsConfig.propTypes = {
	monitors: PropTypes.array.isRequired,
	selectedMonitors: PropTypes.array.isRequired,
	error: PropTypes.string,
	isEditMode: PropTypes.bool.isRequired,
	onSelectMonitors: PropTypes.func.isRequired,
	secondaryLabel: PropTypes.string,
};

export default MonitorsConfig;

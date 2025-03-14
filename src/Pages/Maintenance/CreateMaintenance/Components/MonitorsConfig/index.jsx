import PropTypes from "prop-types";
import ConfigRow from "../ConfigRow";
import Search from "../../../../../Components/Inputs/Search";
import { useState } from "react";

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
		<ConfigRow title="Monitors to apply maintenance window to">
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

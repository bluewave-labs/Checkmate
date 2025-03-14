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
	secondaryLabelText,
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
				secondaryLabel={secondaryLabelText}
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
	secondaryLabelText: PropTypes.string,
};

export default MonitorsConfig;

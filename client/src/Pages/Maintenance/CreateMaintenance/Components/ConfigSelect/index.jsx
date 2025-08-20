import Select from "../../../../../Components/Inputs/Select";
import PropTypes from "prop-types";
const ConfigSelect = ({ configSelection, valueSelect, onChange, ...props }) => {
	const getValueById = (config, id) => {
		const item = config.find((config) => config._id === id);
		return item ? (item.value ? item.value : item.name) : null;
	};

	const getIdByValue = (config, name) => {
		const item = config.find((config) => {
			if (config.value) {
				return config.value === name;
			} else {
				return config.name === name;
			}
		});
		return item ? item._id : null;
	};

	return (
		<Select
			value={getIdByValue(configSelection, valueSelect)}
			onChange={(event) => {
				const newValue = getValueById(configSelection, event.target.value);
				onChange(newValue);
			}}
			items={configSelection}
			{...props}
		/>
	);
};

ConfigSelect.propTypes = {
	configSelection: PropTypes.array.isRequired,
	valueSelect: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};
export default ConfigSelect;

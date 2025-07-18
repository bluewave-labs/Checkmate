// Components
import { TabContext } from "@mui/lab";
import { Tab } from "@mui/material";
import Settings from "./Settings";
import Content from "./Content";

// Utils
import PropTypes from "prop-types";
import CustomTabList from "../../../../../Components/Tab";

const Tabs = ({
	isCreate,
	form,
	errors,
	monitors,
	selectedMonitors,
	setSelectedMonitors,
	handleFormChange,
	handleImageChange,
	progress,
	removeLogo,
	tab,
	setTab,
	TAB_LIST,
	handleDelete,
	isDeleteOpen,
	setIsDeleteOpen,
	isDeleting,
	isLoading,
}) => {
	return (
		<TabContext value={TAB_LIST[tab]}>
			<CustomTabList
				onChange={(_, selected) => {
					setTab(TAB_LIST.indexOf(selected));
				}}
				aria-label="status page tabs"
			>
				{TAB_LIST.map((tabLabel) => (
					<Tab
						key={tabLabel}
						label={tabLabel}
						value={tabLabel}
					/>
				))}
			</CustomTabList>
			{tab === 0 ? (
				<Settings
					tabValue={TAB_LIST[0]}
					form={form}
					handleFormChange={handleFormChange}
					handleImageChange={handleImageChange}
					progress={progress}
					removeLogo={removeLogo}
					errors={errors}
					isCreate={isCreate}
					handleDelete={handleDelete}
					isDeleteOpen={isDeleteOpen}
					setIsDeleteOpen={setIsDeleteOpen}
					isDeleting={isDeleting}
					isLoading={isLoading}
				/>
			) : (
				<Content
					tabValue={TAB_LIST[1]}
					form={form}
					monitors={monitors}
					handleFormChange={handleFormChange}
					errors={errors}
					selectedMonitors={selectedMonitors}
					setSelectedMonitors={setSelectedMonitors}
				/>
			)}
		</TabContext>
	);
};

Tabs.propTypes = {
	isCreate: PropTypes.bool,
	form: PropTypes.object,
	errors: PropTypes.object,
	monitors: PropTypes.array,
	selectedMonitors: PropTypes.array,
	setSelectedMonitors: PropTypes.func,
	handleFormChange: PropTypes.func,
	handleImageChange: PropTypes.func,
	progress: PropTypes.object,
	removeLogo: PropTypes.func,
	tab: PropTypes.number,
	setTab: PropTypes.func,
	TAB_LIST: PropTypes.array,
	handleDelete: PropTypes.func,
	isDeleteOpen: PropTypes.bool,
	setIsDeleteOpen: PropTypes.func,
	isDeleting: PropTypes.bool,
	isLoading: PropTypes.bool,
};

export default Tabs;

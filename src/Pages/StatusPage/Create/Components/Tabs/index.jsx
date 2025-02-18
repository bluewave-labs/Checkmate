// Components
import { TabContext, TabList } from "@mui/lab";
import { Tab } from "@mui/material";
import Settings from "./Settings";
import Content from "./Content";

// Utils
import PropTypes from "prop-types";

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
}) => {
	return (
		<TabContext value={TAB_LIST[tab]}>
			<TabList
				onChange={(_, tab) => {
					setTab(TAB_LIST.indexOf(tab));
				}}
			>
				{TAB_LIST.map((tab, idx) => {
					return (
						<Tab
							key={tab}
							label={TAB_LIST[idx]}
							value={TAB_LIST[idx]}
						/>
					);
				})}
			</TabList>
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
};

export default Tabs;

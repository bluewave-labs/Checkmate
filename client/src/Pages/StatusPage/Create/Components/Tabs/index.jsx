// Components
import { TabContext } from "@mui/lab";
import { Tab, useTheme, Stack, Button } from "@mui/material";
import Settings from "./Settings";
import Content from "./Content";

// Utils
import PropTypes from "prop-types";
import CustomTabList from "../../../../../Components/Tab";
import { useTranslation } from "react-i18next";

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
	isDeleting,
	isDeleteOpen,
	setIsDeleteOpen,
}) => {

	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<TabContext value={TAB_LIST[tab]}>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<CustomTabList
					onChange={(_, selected) => {
						setTab(TAB_LIST.indexOf(selected));
					}}
					aria-label="status page tabs"
				>
					{TAB_LIST.map((tabLabel) => (
						<Tab key={tabLabel} label={tabLabel} value={tabLabel} />
					))}
				</CustomTabList>

				{!isCreate && (<Button 
					variant="contained"
					color="error"
					onClick={() => setIsDeleteOpen(!isDeleteOpen)}
					loading={isDeleting}
				>
					{t("delete")}
				</Button>)}
			</Stack>
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
	isDeleting: PropTypes.bool,
	isDeleteOpen: PropTypes.bool.isRequired,
	setIsDeleteOpen: PropTypes.func.isRequired,
};

export default Tabs;

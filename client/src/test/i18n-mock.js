import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Mock translations for testing
const resources = {
	en: {
		translation: {
			host: "Host",
			incidentsTableStatus: "Status",
			frequency: "Frequency",
			cpu: "CPU",
			memory: "Memory",
			disk: "Disk",
			actions: "Actions",
			monitor: "monitor",
			monitors: "monitors",
			ungroupedMonitors: "Other Monitors",
			group: "Group",
			groupName: "Group Name",
			groupOptional: "Group (Optional)",
			selectGroup: "Select Group",
			createNewGroup: "Create New Group",
			noGroupsFound: "No groups found",
		},
	},
};

i18n.use(initReactI18next).init({
	resources,
	lng: "en",
	fallbackLng: "en",
	debug: false,
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;

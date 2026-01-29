import { BasePageWithStates } from "@/Components/v2/design-elements";

import { useTranslation } from "react-i18next";
const NotificationsPage = () => {
	const { t } = useTranslation();

	return (
		<BasePageWithStates
			page={t("pages.notifications.fallback.title")}
			bullets={
				t("pages.notifications.fallback.checks", {
					returnObjects: true,
				}) as string[]
			}
			loading={false}
			error={false}
			items={[]}
			actionButtonText={t("pages.notifications.fallback.actionButton")}
			actionLink="/notifications/create"
		>
			Notifications
		</BasePageWithStates>
	);
};
export default NotificationsPage;

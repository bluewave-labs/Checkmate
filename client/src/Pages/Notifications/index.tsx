import { BasePageWithStates } from "@/Components/v2/design-elements";
import { NotificationsTable } from "@/Pages/Notifications/components/NotificationsTable";

import { useState } from "react";
import { useGet } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import type { Notification } from "@/Types/Notification";

const NotificationsPage = () => {
	const { t } = useTranslation();

	const [selectedChannel, setSelectedChannel] = useState<Notification | null>(null);

	const {
		data: notifications,
		isLoading,
		isValidating,
		error,
		refetch,
	} = useGet<Notification[]>("/notifications/team");

	return (
		<BasePageWithStates
			page={t("pages.notifications.fallback.title")}
			bullets={
				t("pages.notifications.fallback.checks", { returnObjects: true }) as string[]
			}
			loading={isLoading || isValidating}
			error={!!error}
			items={notifications ?? []}
			actionButtonText={t("pages.notifications.fallback.actionButton")}
			actionLink="/notifications/create"
		>
			<NotificationsTable
				notifications={notifications ?? []}
				setSelectedChannel={setSelectedChannel}
			/>
		</BasePageWithStates>
	);
};

export default NotificationsPage;

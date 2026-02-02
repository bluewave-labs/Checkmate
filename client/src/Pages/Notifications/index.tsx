import { BasePageWithStates } from "@/Components/v2/design-elements";
import { NotificationsTable } from "@/Pages/Notifications/components/NotificationsTable";
import { Dialog } from "@/Components/v2/inputs";
import { HeaderCreate } from "@/Components/v2/common";

import { useState } from "react";
import { useGet, useDelete } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import type { Notification } from "@/Types/Notification";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

const NotificationsPage = () => {
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const [selectedChannel, setSelectedChannel] = useState<Notification | null>(null);
	const isDialogOpen = Boolean(selectedChannel);

	const {
		data: notifications,
		isLoading,
		isValidating,
		error,
		refetch,
	} = useGet<Notification[]>("/notifications/team", {}, { keepPreviousData: true });

	const { deleteFn, loading: isDeleting } = useDelete();

	const handleConfirm = async () => {
		if (!selectedChannel) return;
		await deleteFn(`/notifications/${selectedChannel.id}`);
		setSelectedChannel(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedChannel(null);
	};

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
			<HeaderCreate
				path="/notifications/create"
				isLoading={isLoading || isValidating}
				isAdmin={isAdmin}
			/>
			<NotificationsTable
				notifications={notifications ?? []}
				setSelectedChannel={setSelectedChannel}
			/>
			<Dialog
				open={isDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				loading={isDeleting}
			/>
		</BasePageWithStates>
	);
};

export default NotificationsPage;

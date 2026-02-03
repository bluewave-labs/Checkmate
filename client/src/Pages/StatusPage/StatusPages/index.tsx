import { useState } from "react";
import { BasePageWithStates } from "@/Components/v2/design-elements";
import { Dialog } from "@/Components/v2/inputs";
import { StatusPagesTable } from "./Components/StatusPagesTable";
import { useGet, useDelete } from "@/Hooks/UseApi";
import type { StatusPage } from "@/Types/StatusPage";
import { useTranslation } from "react-i18next";
import { HeaderCreate } from "@/Components/v2/common";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

const StatusPages = () => {
	const { t } = useTranslation();

	const {
		data: statusPages,
		isLoading,
		error,
		refetch,
	} = useGet<StatusPage[]>("/status-page/team");

	const { deleteFn, loading: isDeleting } = useDelete();
	const [selectedStatusPage, setSelectedStatusPage] = useState<StatusPage | null>(null);
	const isDialogOpen = Boolean(selectedStatusPage);

	const isAdmin = useIsAdmin();

	const handleConfirm = async () => {
		if (!selectedStatusPage) return;
		await deleteFn(`/status-page/${selectedStatusPage.id}`);
		setSelectedStatusPage(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedStatusPage(null);
	};

	return (
		<BasePageWithStates
			page={t("pages.statusPages.title")}
			loading={isLoading}
			bullets={
				t("pages.statusPages.fallback.checks", { returnObjects: true }) as string[]
			}
			error={!!error}
			items={statusPages ?? []}
			actionButtonText={t("pages.statusPages.fallback.actionButton")}
			actionLink="/status/create"
		>
			<HeaderCreate
				path="/status/create"
				isAdmin={isAdmin}
			/>
			<StatusPagesTable
				data={statusPages ?? []}
				setSelectedStatusPage={setSelectedStatusPage}
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

export default StatusPages;

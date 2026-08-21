import { BasePageWithStates } from "@/Components/design-elements";
import { ProxiesTable } from "@/Pages/Proxies/components/ProxiesTable";
import { Dialog } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";

import { useState } from "react";
import { useGet, useDelete } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import type { ProxyResponse } from "@/Types/Proxy";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

const ProxiesPage = () => {
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const [selectedProxy, setSelectedProxy] = useState<ProxyResponse | null>(null);
	const isDialogOpen = Boolean(selectedProxy);

	const {
		data: proxies,
		isLoading,
		isValidating,
		error,
		refetch,
	} = useGet<ProxyResponse[]>("/proxies/team", {}, { keepPreviousData: true });

	const { deleteFn, loading: isDeleting } = useDelete();

	const handleConfirm = async () => {
		if (!selectedProxy) return;
		await deleteFn(`/proxies/${selectedProxy.id}`);
		setSelectedProxy(null);
		refetch();
	};
	``;
	const handleCancel = () => {
		setSelectedProxy(null);
	};

	return (
		<BasePageWithStates
			headerKey="proxies"
			page={t("pages.proxies.fallback.title")}
			description={t("pages.proxies.fallback.description")}
			loading={isLoading || isValidating}
			error={!!error}
			totalCount={proxies?.length ?? 0}
			actionButtonText={t("pages.proxies.fallback.actionButton")}
			actionLink="/proxies/create"
		>
			<HeaderCreate
				path="/proxies/create"
				isLoading={isLoading || isValidating}
				isAdmin={isAdmin}
			/>
			<ProxiesTable
				proxies={proxies ?? []}
				setSelectedProxy={setSelectedProxy}
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

export default ProxiesPage;

import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { BaseFallback, EmptyFallback, ErrorFallback } from "@/Components/design-elements";
import { ProxiesTable } from "./ProxiesTable";
import { Dialog } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";
import { LAYOUT } from "@/Utils/Theme/constants";

import { useState } from "react";
import { useGet, useDelete } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import type { ProxyResponse } from "@/Types/Proxy";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

export const ProxiesSettings = () => {
	const { t } = useTranslation();
	const theme = useTheme();
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

	const handleCancel = () => {
		setSelectedProxy(null);
	};

	const isFetching = isLoading || isValidating;
	const hasItems = (proxies?.length ?? 0) > 0;

	if (error) {
		return (
			<ErrorFallback
				title={t("common.fallback.error.title")}
				subtitle={t("common.fallback.error.description")}
			/>
		);
	}

	if (isFetching && !hasItems) {
		return (
			<BaseFallback>
				<CircularProgress
					color="primary"
					size={28}
				/>
			</BaseFallback>
		);
	}

	if (!hasItems) {
		return (
			<EmptyFallback
				title={t("pages.proxies.fallback.title")}
				description={t("pages.proxies.fallback.description")}
				actionButtonText={t("pages.proxies.fallback.actionButton")}
				actionLink="/proxies/create"
			/>
		);
	}

	return (
		<Stack spacing={theme.spacing(LAYOUT.LG)}>
			<HeaderCreate
				path="/proxies/create"
				isLoading={isFetching}
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
		</Stack>
	);
};

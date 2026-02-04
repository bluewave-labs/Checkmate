import { BasePageWithStates } from "@/Components/v2/design-elements";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import { MaintenanceWindowTable } from "./MaintenanceWindowTable";
import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";

interface MaintenanceWindowsResponse {
	maintenanceWindows: MaintenanceWindow[];
	maintenanceWindowCount: number;
}

const MaintenanceWindowPage = () => {
	const { t } = useTranslation();
	const [page, setPage] = useState(0);
	const rowsPerPage = useSelector(
		(state: RootState) => state?.ui?.maintenance?.rowsPerPage ?? 5
	);

	const { data, isLoading, error, refetch } = useGet<MaintenanceWindowsResponse>(
		`/maintenance-window/team?page=${page}&rowsPerPage=${rowsPerPage}`
	);

	const handleUpdate = useCallback(() => {
		refetch();
	}, [refetch]);

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage);
	}, []);

	const maintenanceWindows = data?.maintenanceWindows ?? [];
	const maintenanceWindowCount = data?.maintenanceWindowCount ?? 0;

	return (
		<BasePageWithStates
			page={t("pages.maintenanceWindow.fallback.title")}
			bullets={
				t("pages.maintenanceWindow.fallback.checks", { returnObjects: true }) as string[]
			}
			loading={isLoading}
			error={!!error}
			items={maintenanceWindows}
			actionButtonText={t("pages.maintenanceWindow.fallback.actionButton")}
			actionLink="/maintenance/create"
		>
			<MaintenanceWindowTable
				maintenanceWindows={maintenanceWindows}
				maintenanceWindowCount={maintenanceWindowCount}
				page={page}
				setPage={handlePageChange}
				updateCallback={handleUpdate}
			/>
		</BasePageWithStates>
	);
};

export default MaintenanceWindowPage;

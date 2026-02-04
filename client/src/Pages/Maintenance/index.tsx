import { BasePageWithStates } from "@/Components/v2/design-elements";
import { HeaderCreate } from "@/Components/v2/common";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import { MaintenanceWindowTable } from "./MaintenanceWindowTable";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

interface MaintenanceWindowsResponse {
	maintenanceWindows: MaintenanceWindow[];
	maintenanceWindowCount: number;
}

const MaintenanceWindowPage = () => {
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();
	const [page, setPage] = useState(0);
	const rowsPerPage = useSelector(
		(state: RootState) => state?.ui?.maintenance?.rowsPerPage ?? 5
	);

	const { data, isLoading, isValidating, error, refetch } =
		useGet<MaintenanceWindowsResponse>(
			`/maintenance-window/team?page=${page}&rowsPerPage=${rowsPerPage}`
		);

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
			<HeaderCreate
				path="/maintenance/create"
				isLoading={isLoading || isValidating}
				isAdmin={isAdmin}
			/>
			<MaintenanceWindowTable
				maintenanceWindows={maintenanceWindows}
				maintenanceWindowCount={maintenanceWindowCount}
				page={page}
				setPage={setPage}
				refetch={refetch}
			/>
		</BasePageWithStates>
	);
};

export default MaintenanceWindowPage;

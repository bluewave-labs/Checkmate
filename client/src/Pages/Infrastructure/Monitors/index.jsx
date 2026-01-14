// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import MonitorCountHeader from "@/Components/v1/MonitorCountHeader/index.jsx";
import MonitorCreateHeader from "@/Components/v1/MonitorCreateHeader/index.jsx";
import MonitorsTable from "./Components/MonitorsTable/index.jsx";
import Pagination from "@/Components/v1/Table/TablePagination/index.jsx";
import PageStateWrapper from "@/Components/v1/PageStateWrapper/index.jsx";
import Filter from "./Components/Filters/index.jsx";
import SearchComponent from "../../Uptime/Monitors/Components/SearchComponent/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { useEffect, useState } from "react";
import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import { useTranslation } from "react-i18next";
import { useFetchMonitorsWithChecks } from "@/Hooks/monitorHooks.js";

import { useDispatch, useSelector } from "react-redux";
import { setRowsPerPage } from "../../../Features/UI/uiSlice.js";
// Constants
const TYPES = ["hardware"];
const BREADCRUMBS = [{ name: `infrastructure`, path: "/infrastructure" }];

const InfrastructureMonitors = () => {
	// Redux state
	const rowsPerPage = useSelector((state) => state.ui?.infrastructure?.rowsPerPage ?? 5);
	const dispatch = useDispatch();

	// Local state
	const [page, setPage] = useState(0);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState(undefined);
	const [toFilterStatus, setToFilterStatus] = useState(undefined);
	const [search, setSearch] = useState(undefined);
	const [isSearching, setIsSearching] = useState(false);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { t } = useTranslation();

	// Handlers
	const handleActionMenuDelete = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		dispatch(
			setRowsPerPage({
				value: parseInt(event.target.value, 10),
				table: "infrastructure",
			})
		);
		setPage(0);
	};

	useEffect(() => {
		if (isSearching) {
			setPage(0);
		}
	}, [isSearching]);

	const handleReset = () => {
		setSelectedStatus(undefined);
		setToFilterStatus(undefined);
	};

	const field = toFilterStatus !== undefined ? "status" : undefined;

	const [monitors, count, isLoading, networkError] = useFetchMonitorsWithChecks({
		types: TYPES,
		limit: 1,
		page: page,
		field: field,
		filter: toFilterStatus ?? search,
		rowsPerPage: rowsPerPage,
		monitorUpdateTrigger: updateTrigger,
	});

	return (
		<>
			<PageStateWrapper
				networkError={networkError}
				isLoading={isLoading}
				items={monitors}
				type="infrastructureMonitor"
				fallbackLink="/infrastructure/create"
			>
				<Stack gap={theme.spacing(10)}>
					<Breadcrumbs list={BREADCRUMBS} />
					<MonitorCreateHeader
						isAdmin={isAdmin}
						isLoading={isLoading}
						path="/infrastructure/create"
					/>
					<Stack direction={"row"}>
						<MonitorCountHeader
							isLoading={isLoading}
							monitorCount={count || 0}
						/>
						<Filter
							selectedStatus={selectedStatus}
							setSelectedStatus={setSelectedStatus}
							setToFilterStatus={setToFilterStatus}
							handleReset={handleReset}
						/>
						<SearchComponent
							monitors={monitors}
							onSearchChange={setSearch}
							setIsSearching={setIsSearching}
						/>
					</Stack>

					<MonitorsTable
						isLoading={isLoading}
						monitors={monitors}
						isAdmin={isAdmin}
						handleActionMenuDelete={handleActionMenuDelete}
						isSearching={isSearching}
					/>
					<Pagination
						itemCount={count || 0}
						paginationLabel={t("monitors")}
						page={page}
						rowsPerPage={rowsPerPage}
						handleChangePage={handleChangePage}
						handleChangeRowsPerPage={handleChangeRowsPerPage}
					/>
				</Stack>
			</PageStateWrapper>
		</>
	);
};

export default InfrastructureMonitors;

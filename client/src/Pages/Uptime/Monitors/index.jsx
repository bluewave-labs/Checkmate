// Required Data
// 1. Monitor summary
// 2. List of monitors filtered by search term with 25 checks each
// 2a.List of monitors must have the total number of monitors that match.

// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Greeting from "../../../Utils/greeting";
import StatusBoxes from "./Components/StatusBoxes";
import UptimeDataTable from "./Components/UptimeDataTable";
import Pagination from "../../../Components/Table/TablePagination";
import CreateMonitorHeader from "../../../Components/MonitorCreateHeader";
import Fallback from "../../../Components/Fallback";
import GenericFallback from "../../../Components/GenericFallback";
import SearchComponent from "./Components/SearchComponent";
import Filter from "./Components/Filter";

import MonitorCountHeader from "../../../Components/MonitorCountHeader";

// MUI Components
import { Stack, Box, Button, Typography } from "@mui/material";

// Utils
import { useState, useCallback } from "react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "../../../Features/UI/uiSlice";
import PropTypes from "prop-types";
import useFetchMonitorsWithSummary from "../../../Hooks/useFetchMonitorsWithSummary";
import useFetchMonitorsWithChecks from "../../../Hooks/useFetchMonitorsWithChecks";
import { useTranslation } from "react-i18next";
const BREADCRUMBS = [{ name: `Uptime`, path: "/uptime" }];
const TYPES = ["http", "ping", "docker", "port"];
const CreateMonitorButton = ({ shouldRender }) => {
	// Utils
	const navigate = useNavigate();
	if (shouldRender === false) {
		return;
	}

	return (
		<Box alignSelf="flex-end">
			<Button
				variant="contained"
				color="accent"
				onClick={() => {
					navigate("/uptime/create");
				}}
			>
				Create new
			</Button>
		</Box>
	);
};

CreateMonitorButton.propTypes = {
	shouldRender: PropTypes.bool,
};

const UptimeMonitors = () => {
	// Redux state
	const { user } = useSelector((state) => state.auth);
	const rowsPerPage = useSelector((state) => state.ui.monitors.rowsPerPage);

	// Local state
	const [search, setSearch] = useState(undefined);
	const [page, setPage] = useState(undefined);
	const [sort, setSort] = useState(undefined);
	const [isSearching, setIsSearching] = useState(false);
	const [monitorUpdateTrigger, setMonitorUpdateTrigger] = useState(false);
	const [selectedTypes, setSelectedTypes] = useState(undefined);
	const [selectedState, setSelectedState] = useState(undefined);
	const [selectedStatus, setSelectedStatus] = useState(undefined);
	const [toFilterStatus, setToFilterStatus] = useState(undefined);
	const [toFilterActive, setToFilterActive] = useState(undefined);

	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const dispatch = useDispatch();
	const { t } = useTranslation();

	// Handlers
	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		dispatch(
			setRowsPerPage({
				value: parseInt(event.target.value, 10),
				table: "monitors",
			})
		);
		setPage(0);
	};

	const triggerUpdate = useCallback(() => {
		setMonitorUpdateTrigger((prev) => !prev);
	}, []);

	const teamId = user.teamId;

	const [monitors, monitorsSummary, monitorsWithSummaryIsLoading, networkError] =
		useFetchMonitorsWithSummary({
			teamId,
			types: TYPES,
			monitorUpdateTrigger,
		});

	const handleReset = () => {
		setSelectedState(undefined);
		setSelectedTypes(undefined);
		setSelectedStatus(undefined);
		setToFilterStatus(undefined);
		setToFilterActive(undefined);
	};

	const filterLookup = new Map([
		[toFilterStatus, "status"],
		[toFilterActive, "isActive"],
	]);

	const activeFilter = [...filterLookup].find(([key]) => key !== undefined);
	const field = activeFilter?.[1] || sort?.field;
	const filter = activeFilter?.[0] || search;

	const effectiveTypes = selectedTypes?.length ? selectedTypes : TYPES;

	const [
		monitorsWithChecks,
		monitorsWithChecksCount,
		monitorsWithChecksIsLoading,
		monitorsWithChecksNetworkError,
	] = useFetchMonitorsWithChecks({
		teamId,
		types: effectiveTypes,
		limit: 25,
		page: page,
		rowsPerPage: rowsPerPage,
		filter: filter,
		field: field,
		order: sort?.order,
		monitorUpdateTrigger,
	});

	const isLoading = monitorsWithSummaryIsLoading || monitorsWithChecksIsLoading;
	if (networkError) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("networkError")}
				</Typography>
				<Typography>{t("checkConnection")}</Typography>
			</GenericFallback>
		);
	}
	if (
		!isLoading &&
		(monitorsSummary?.totalMonitors === 0 ||
			typeof monitorsSummary?.totalMonitors === "undefined")
	) {
		return (
			<Fallback
				vowelStart={true}
				title="uptime monitor"
				checks={[
					"Check if websites or servers are online & responsive",
					"Alert teams about downtime or performance issues",
					"Monitor HTTP endpoints, pings, containers & ports",
					"Track historical uptime and reliability trends",
				]}
				link="/uptime/create"
				isAdmin={isAdmin}
			/>
		);
	}
	return (
		<Stack
			className="monitors"
			gap={theme.spacing(10)}
		>
			<Breadcrumbs list={BREADCRUMBS} />
			<CreateMonitorHeader
				isAdmin={isAdmin}
				isLoading={isLoading}
				path="/uptime/create"
				bulkPath="/uptime/bulk-import"
			/>
			<Greeting type="uptime" />
			<StatusBoxes
				monitorsSummary={monitorsSummary}
				shouldRender={!monitorsWithSummaryIsLoading}
			/>

			<Stack direction={"row"}>
				<MonitorCountHeader
					shouldRender={monitors?.length > 0 && !monitorsWithSummaryIsLoading}
					monitorCount={monitorsSummary?.totalMonitors}
				></MonitorCountHeader>
				<Filter
					selectedTypes={selectedTypes}
					setSelectedTypes={setSelectedTypes}
					selectedStatus={selectedStatus}
					setSelectedStatus={setSelectedStatus}
					selectedState={selectedState}
					setSelectedState={setSelectedState}
					setToFilterStatus={setToFilterStatus}
					setToFilterActive={setToFilterActive}
					handleReset={handleReset}
				/>
				<SearchComponent
					monitors={monitors}
					onSearchChange={setSearch}
					setIsSearching={setIsSearching}
				/>
			</Stack>
			<UptimeDataTable
				isAdmin={isAdmin}
				isSearching={isSearching}
				filteredMonitors={monitorsWithChecks}
				sort={sort}
				setSort={setSort}
				monitorsAreLoading={monitorsWithChecksIsLoading}
				triggerUpdate={triggerUpdate}
			/>
			<Pagination
				itemCount={monitorsWithChecksCount}
				paginationLabel="monitors"
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</Stack>
	);
};

export default UptimeMonitors;

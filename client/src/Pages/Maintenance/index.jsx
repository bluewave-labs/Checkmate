import { Stack, Button } from "@mui/material";
import { useTheme } from "@emotion/react";
import Fallback from "../../Components/Fallback";
import { useState, useEffect } from "react";
import "./index.css";
import MaintenanceTable from "./MaintenanceTable";
import { useSelector } from "react-redux";
import { networkService } from "../../main";
import Breadcrumbs from "../../Components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "../../Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";
import GenericFallback from "../../Components/GenericFallback";

const Maintenance = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const rowsPerPage = useSelector((state) => state?.ui?.maintenance?.rowsPerPage ?? 5);
	const isAdmin = useIsAdmin();
	const [maintenanceWindows, setMaintenanceWindows] = useState([]);
	const [maintenanceWindowCount, setMaintenanceWindowCount] = useState(0);
	const [page, setPage] = useState(0);
	const [sort, setSort] = useState({});
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const [isDataFetched, setIsDataFetched] = useState(false);

	const handleActionMenuDelete = () => {
		setUpdateTrigger((prev) => !prev);
	};

	useEffect(() => {
		const fetchMaintenanceWindows = async () => {
			try {
				const response = await networkService.getMaintenanceWindowsByTeamId({
					page: page,
					rowsPerPage: rowsPerPage,
				});
				const { maintenanceWindows, maintenanceWindowCount } = response.data.data;
				setMaintenanceWindows(maintenanceWindows);
				setMaintenanceWindowCount(maintenanceWindowCount);
			} catch (error) {
				setNetworkError(true);
			} finally {
				setIsDataFetched(true);
			}
		};
		fetchMaintenanceWindows();
	}, [page, rowsPerPage, updateTrigger]);

	if (networkError) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("common.toasts.networkError")}
				</Typography>
				<Typography>{t("common.toasts.checkConnection")}</Typography>
			</GenericFallback>
		);
	}
	// Only show the fallback if we've fetched data and there are no maintenance windows
	if (isDataFetched && maintenanceWindows.length === 0) {
		return (
			<Fallback
				type="maintenanceWindow"
				title={t("maintenanceWindow.fallback.title")}
				checks={t("maintenanceWindow.fallback.checks", { returnObjects: true })}
				link="/maintenance/create"
				isAdmin={isAdmin}
			/>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				mt={theme.spacing(5)}
			>
				<Breadcrumbs list={[{ name: "maintenance", path: "/maintenance" }]} />
				<Button
					variant="contained"
					color="accent"
					onClick={() => {
						navigate("/maintenance/create");
					}}
					sx={{ fontWeight: 500 }}
				>
					{t("createMaintenanceWindow")}
				</Button>
			</Stack>
			<MaintenanceTable
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				sort={sort}
				setSort={setSort}
				maintenanceWindows={maintenanceWindows}
				maintenanceWindowCount={maintenanceWindowCount}
				updateCallback={handleActionMenuDelete}
			/>
		</Stack>
	);
};

export default Maintenance;

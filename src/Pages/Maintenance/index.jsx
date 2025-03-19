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

const Maintenance = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { rowsPerPage } = useSelector((state) => state.ui.maintenance);
	const isAdmin = useIsAdmin();
	const [maintenanceWindows, setMaintenanceWindows] = useState([]);
	const [maintenanceWindowCount, setMaintenanceWindowCount] = useState(0);
	const [page, setPage] = useState(0);
	const [sort, setSort] = useState({});
	const [updateTrigger, setUpdateTrigger] = useState(false);

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
				console.log(error);
			}
		};
		fetchMaintenanceWindows();
	}, [page, rowsPerPage, updateTrigger]);

	if (maintenanceWindows.length === 0) {
		return (
			<Fallback
				title="maintenance window"
				checks={[
					"Mark your maintenance periods",
					"Eliminate any misunderstandings",
					"Stop sending alerts in maintenance windows",
				]}
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

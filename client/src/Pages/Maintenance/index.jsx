import { Stack, Button } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useState, useEffect } from "react";
import "./index.css";
import MaintenanceTable from "./MaintenanceTable";
import { useSelector } from "react-redux";
import { networkService } from "../../main";
import Breadcrumbs from "../../Components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageStateWrapper from "../../Components/PageStateWrapper";

const Maintenance = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const rowsPerPage = useSelector((state) => state?.ui?.maintenance?.rowsPerPage ?? 5);
	const [maintenanceWindows, setMaintenanceWindows] = useState([]);
	const [maintenanceWindowCount, setMaintenanceWindowCount] = useState(0);
	const [page, setPage] = useState(0);
	const [sort, setSort] = useState({});
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleActionMenuDelete = () => {
		setUpdateTrigger((prev) => !prev);
	};

	useEffect(() => {
		const fetchMaintenanceWindows = async () => {
			try {
				setIsLoading(true);
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
				setIsLoading(false);
			}
		};
		fetchMaintenanceWindows();
	}, [page, rowsPerPage, updateTrigger]);

	return (
		<>
			<PageStateWrapper
				networkError={networkError}
				isLoading={isLoading}
				items={maintenanceWindows}
				type="maintenanceWindow"
				fallbackLink="/maintenance/create"
			>
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
			</PageStateWrapper>
		</>
	);
};

export default Maintenance;

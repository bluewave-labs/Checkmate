import PropTypes from "prop-types";
import { Box } from "@mui/material";
import DataTable from "../../../Components/Table";
import Pagination from "../../../Components/Table/TablePagination";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ActionsMenu from "./ActionsMenu";
import { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDurationRounded } from "../../../Utils/timeUtils";
import { StatusLabel } from "../../../Components/Label";
import { setRowsPerPage } from "../../../Features/UI/uiSlice";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
/**
 * Component for pagination actions (first, previous, next, last).
 *
 * @component
 * @param {Object} props
 * @param {number} props.count - Total number of items.
 * @param {number} props.page - Current page number.
 * @param {number} props.rowsPerPage - Number of rows per page.
 * @param {function} props.onPageChange - Callback function to handle page change.
 *
 * @returns {JSX.Element} Pagination actions component.
 */

const MaintenanceTable = ({
	page,
	setPage,
	sort,
	setSort,
	maintenanceWindows,
	maintenanceWindowCount,
	updateCallback,
}) => {
	const rowsPerPage = useSelector((state) => state?.ui?.maintenance?.rowsPerPage ?? 5);
	const dispatch = useDispatch();
	const theme = useTheme();
	const navigate = useNavigate();
	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		dispatch(
			setRowsPerPage({
				value: parseInt(event.target.value, 10),
				table: "maintenance",
			})
		);
		setPage(0);
	};

	const { t } = useTranslation();

	const headers = [
		{
			id: "name",
			content: (
				<Box onClick={() => handleSort("name")}>
					{t("maintenanceWindowName")}
					<span
						style={{
							visibility: sort.field === "name" ? "visible" : "hidden",
						}}
					>
						{sort.order === "asc" ? (
							<ArrowUpwardRoundedIcon />
						) : (
							<ArrowDownwardRoundedIcon />
						)}
					</span>
				</Box>
			),
			render: (row) => row.name,
		},
		{
			id: "status",
			content: (
				<Box onClick={() => handleSort("status")}>
					{" "}
					{t("status")}
					<span
						style={{
							visibility: sort.field === "active" ? "visible" : "hidden",
						}}
					>
						{sort.order === "asc" ? (
							<ArrowUpwardRoundedIcon />
						) : (
							<ArrowDownwardRoundedIcon />
						)}
					</span>
				</Box>
			),
			render: (row) => {
				const status = row.active ? "up" : "paused";
				const text = row.active ? "active" : "paused";

				return (
					<StatusLabel
						status={status}
						text={text}
						customStyles={{ textTransform: "capitalize" }}
					/>
				);
			},
		},
		{
			id: "nextWindow",
			content: t("nextWindow"),
			render: (row) => {
				return getTimeToNextWindow(row.start, row.end, row.repeat);
			},
		},
		{
			id: "repeat",
			content: t("repeat"),
			render: (row) => {
				return row.repeat === 0 ? "N/A" : formatDurationRounded(row.repeat);
			},
		},
		{
			id: "actions",
			content: t("actions"),
			render: (row) => (
				<ActionsMenu
					maintenanceWindow={row}
					updateCallback={updateCallback}
				/>
			),
		},
	];

	const getTimeToNextWindow = (startTime, endTime, repeat) => {
		//1.  Advance time closest to next window as possible
		const now = dayjs();
		let start = dayjs(startTime);
		let end = dayjs(endTime);
		if (repeat > 0) {
			// Advance time closest to next window as possible
			while (start.isBefore(now) && end.isBefore(now)) {
				start = start.add(repeat, "milliseconds");
				end = end.add(repeat, "milliseconds");
			}
		}

		//Check if we are in a window
		if (now.isAfter(start) && now.isBefore(end)) {
			return "In maintenance window";
		}

		if (start.isAfter(now)) {
			const diffInMinutes = start.diff(now, "minutes");
			const diffInHours = start.diff(now, "hours");
			const diffInDays = start.diff(now, "days");

			if (diffInMinutes < 60) {
				return diffInMinutes + " minutes";
			} else if (diffInHours < 24) {
				return diffInHours + " hours";
			} else if (diffInDays < 7) {
				return diffInDays + " days";
			} else {
				return diffInDays + " days";
			}
		}
	};

	const handleSort = async (field) => {
		let order = "";
		if (sort.field !== field) {
			order = "desc";
		} else {
			order = sort.order === "asc" ? "desc" : "asc";
		}
		setSort({ field, order });
	};

	return (
		<>
			<DataTable
				config={{
					rowSX: {
						cursor: "pointer",
						"&:hover td": {
							backgroundColor: theme.palette.tertiary.main,
							transition: "background-color .3s ease",
						},
					},
					onRowClick: (row) => {
						navigate(`/maintenance/create/${row._id}`);
					},
				}}
				headers={headers}
				data={maintenanceWindows}
			/>
			<Pagination
				itemCount={maintenanceWindowCount}
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</>
	);
};

MaintenanceTable.propTypes = {
	isAdmin: PropTypes.bool,
	page: PropTypes.number,
	setPage: PropTypes.func,
	rowsPerPage: PropTypes.number,
	setRowsPerPage: PropTypes.func,
	sort: PropTypes.object,
	setSort: PropTypes.func,
	maintenanceWindows: PropTypes.array,
	maintenanceWindowCount: PropTypes.number,
	updateCallback: PropTypes.func,
};

const MemoizedMaintenanceTable = memo(MaintenanceTable);
export default MemoizedMaintenanceTable;

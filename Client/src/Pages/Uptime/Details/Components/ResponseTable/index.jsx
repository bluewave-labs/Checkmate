import ChartBox from "../Charts/ChartBox";
import PropTypes from "prop-types";
import HistoryIcon from "../../../../../assets/icons/history-icon.svg?react";
import Table from "../../../../../Components/Table";
import TablePagination from "../../../../../Components/Table/TablePagination";
import { StatusLabel } from "../../../../../Components/Label";
import { formatDateWithTz } from "../../../../../Utils/timeUtils";
import SkeletonLayout from "./skeleton";
const ResponseTable = ({
	shouldRender = true,
	checks,
	checksCount,
	uiTimezone,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}) => {
	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	const headers = [
		{
			id: "status",
			content: "Status",
			render: (row) => {
				const status = row.status === true ? "up" : "down";

				return (
					<StatusLabel
						status={status}
						text={status}
						customStyles={{ textTransform: "capitalize" }}
					/>
				);
			},
		},
		{
			id: "date",
			content: "Date & Time",
			render: (row) =>
				formatDateWithTz(row.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone),
		},
		{
			id: "statusCode",
			content: "Status code",
			render: (row) => (row.statusCode ? row.statusCode : "N/A"),
		},
		{
			id: "message",
			content: "Message",
			render: (row) => row.message,
		},
	];

	return (
		<ChartBox
			icon={<HistoryIcon />}
			header="Response Times"
			height="100%"
		>
			<Table
				headers={headers}
				data={checks}
			/>
			<TablePagination
				page={page}
				handleChangePage={setPage}
				rowsPerPage={rowsPerPage}
				handleChangeRowsPerPage={setRowsPerPage}
				itemCount={checksCount}
			/>
		</ChartBox>
	);
};

ResponseTable.propTypes = {
	shouldRender: PropTypes.bool,
	checks: PropTypes.array.isRequired,
	checksCount: PropTypes.number.isRequired,
	uiTimezone: PropTypes.string.isRequired,
	page: PropTypes.number.isRequired,
	setPage: PropTypes.func.isRequired,
	rowsPerPage: PropTypes.number.isRequired,
	setRowsPerPage: PropTypes.func.isRequired,
};

export default ResponseTable;

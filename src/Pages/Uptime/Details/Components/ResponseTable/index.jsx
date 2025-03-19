import ChartBox from "../../../../../Components/Charts/ChartBox";
import PropTypes from "prop-types";
import HistoryIcon from "../../../../../assets/icons/history-icon.svg?react";
import Table from "../../../../../Components/Table";
import TablePagination from "../../../../../Components/Table/TablePagination";
import { StatusLabel } from "../../../../../Components/Label";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "../../../../../Utils/timeUtils";
import SkeletonLayout from "./skeleton";
const ResponseTable = ({
	isLoading = false,
	checks = [],
	checksCount,
	uiTimezone,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}) => {
<<<<<<< Updated upstream
	const { t } = useTranslation();
	if (!shouldRender) {
=======
	if (isLoading) {
>>>>>>> Stashed changes
		return <SkeletonLayout />;
	}

	const headers = [
		{
			id: "status",
			content: t("status"),
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
			content: t("date&Time"),
			render: (row) =>
				formatDateWithTz(row.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone),
		},
		{
			id: "statusCode",
			content: t("statusCode"),
			render: (row) => (row.statusCode ? row.statusCode : "N/A"),
		},
		{
			id: "message",
			content: t("message"),
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
	isLoading: PropTypes.bool,
	checks: PropTypes.array,
	checksCount: PropTypes.number,
	uiTimezone: PropTypes.string.isRequired,
	page: PropTypes.number.isRequired,
	setPage: PropTypes.func.isRequired,
	rowsPerPage: PropTypes.number.isRequired,
	setRowsPerPage: PropTypes.func.isRequired,
};

export default ResponseTable;

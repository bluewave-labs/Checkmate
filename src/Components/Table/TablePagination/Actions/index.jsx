import PropTypes from "prop-types";
import { Box, Button } from "@mui/material";
import LeftArrowDouble from "../../../../assets/icons/left-arrow-double.svg?react";
import RightArrowDouble from "../../../../assets/icons/right-arrow-double.svg?react";
import LeftArrow from "../../../../assets/icons/left-arrow.svg?react";
import RightArrow from "../../../../assets/icons/right-arrow.svg?react";

TablePaginationActions.propTypes = {
	count: PropTypes.number.isRequired,
	page: PropTypes.number.isRequired,
	rowsPerPage: PropTypes.number.isRequired,
	onPageChange: PropTypes.func.isRequired,
};

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

function TablePaginationActions({ count, page, rowsPerPage, onPageChange }) {
	const handleFirstPageButtonClick = (event) => {
		onPageChange(event, 0);
	};
	const handleBackButtonClick = (event) => {
		onPageChange(event, page - 1);
	};
	const handleNextButtonClick = (event) => {
		onPageChange(event, page + 1);
	};
	const handleLastPageButtonClick = (event) => {
		onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
	};

	return (
		<Box sx={{ flexShrink: 0, ml: "24px" }}>
			<Button
				variant="group"
				onClick={handleFirstPageButtonClick}
				disabled={page === 0}
				aria-label="first page"
			>
				<LeftArrowDouble />
			</Button>
			<Button
				variant="group"
				onClick={handleBackButtonClick}
				disabled={page === 0}
				aria-label="previous page"
			>
				<LeftArrow />
			</Button>
			<Button
				variant="group"
				onClick={handleNextButtonClick}
				disabled={page >= Math.ceil(count / rowsPerPage) - 1}
				aria-label="next page"
			>
				<RightArrow />
			</Button>
			<Button
				variant="group"
				onClick={handleLastPageButtonClick}
				disabled={page >= Math.ceil(count / rowsPerPage) - 1}
				aria-label="last page"
			>
				<RightArrowDouble />
			</Button>
		</Box>
	);
}

export { TablePaginationActions };

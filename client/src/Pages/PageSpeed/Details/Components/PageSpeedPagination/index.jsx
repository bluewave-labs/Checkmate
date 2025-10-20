import PropTypes from "prop-types"
import { useTheme } from "@emotion/react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Stack, Typography, TablePagination } from "@mui/material";
import Select from "../../../../../Components/Inputs/Select";
import { formatDateWithTz } from "../../../../../Utils/timeUtils"
import { TablePaginationActions } from "./Actions"

PageSpeedPagination.propTypes = {
    itemCount: PropTypes.number,
    page: PropTypes.number,
    pageCount: PropTypes.number.isRequired,
    handleChangePage: PropTypes.func.isRequired,
    handleChangeTimeRange: PropTypes.func,
    timeRange: PropTypes.number,
    timeRangeLabel: PropTypes.array
}

// Determine whether pagination buttons should be shown
const shouldShowPaginationButtons = (pageCount) => {
	return pageCount > 1
};

// Empty action component for pagination (no-op component)
const EmptyPaginationActions = () => <div />;

/**
 * Pagination component for table navigation with customized styling and behavior.
 *
 * @param {object} props - Component properties.
 * @param {number} props.page - Current page index (0-based).
 * @param {function} props.handleChangePage - Callback for handling page changes.
 * @returns {JSX.Element} The Pagination component.
 */

function PageSpeedPagination ({
    page = 0,
    pageCount = 1,
    handleChangePage,
    handleChangeTimeRange,
    timeRange,
    timeRangeLabel
}) {
    const theme = useTheme();
    const { t } = useTranslation();
    const uiTimzeone = useSelector((state) => state.ui.timezone);
    const firstDate = formatDateWithTz(timeRangeLabel[0], "h:mm a", uiTimzeone)
    const lastDate = formatDateWithTz(timeRangeLabel[1], "h:mm a", uiTimzeone)
    const showPaginationButtons = shouldShowPaginationButtons(pageCount);

    const TIME_RANGES = [
        { _id: 0.5, name: t('time.thirtyMinutes')},
        { _id: 1, name: t('time.oneHour')},
		{ _id: 2, name: t('time.twoHours') },
		{ _id: 6, name: t('time.sixHours') },
		{ _id: 12, name: t('time.twelveHours')},
		{ _id: 24, name: t('time.oneDay') },
	];

        return (
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                px={theme.spacing(4)}
                marginTop={8}
            >
                <Typography
                    px={theme.spacing(2)}
                    variant="body2"
                    sx={{ opacity: 0.7 }}
                >
                    {firstDate} - {lastDate}
                </Typography>
                <Stack
                    direction="row"
                    alignItems={"center"}
                    gap={theme.spacing(4)}
                >
                    <Typography
                        display="inline-block"
                        component="h1"
                        color={theme.palette.primary.contrastTextSecondary}
                    >
                        Time range:
                    </Typography>

                    <Select
                        id="pagespeed-timerange"
                        name="timerange"
                        value={timeRange}
                        onChange={handleChangeTimeRange}
                        items={TIME_RANGES}
                    />
                </Stack>
                <TablePagination
                    component="div"
                    count={pageCount}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={0}
                    rowsPerPageOptions={[]}
                    labelDisplayedRows={() =>``}
                    ActionsComponent={
                        showPaginationButtons ? TablePaginationActions : EmptyPaginationActions
                    }
                />
            </Stack>
        );
}

export default PageSpeedPagination
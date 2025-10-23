import ChartBox from "@/Components/v1/Charts/ChartBox/index.jsx";
import AreaChart from "../Charts/AreaChart";
import AreaChartLegend from "../Charts/AreaChartLegend";
import Pagination from "../PageSpeedPagination";
import SkeletonLayout from "./skeleton";
import ScoreIcon from "../../../../../../assets/icons/monitor-graph-line.svg?react";
import { Stack } from "@mui/material";
import PropTypes from "prop-types";

import { useState, useMemo } from "react";
import { useTheme } from "@emotion/react";

/**
 * Processes data to insert gaps with null values based on the interval.
 * @param {Array} data
 * @param {number} interval - The interval in milliseconds for gaps.
 * @returns {Array} The formatted data with gaps.
 */
const processDataWithGaps = (data, interval) => {
	if (data.length === 0) return [];
	let formattedData = [];
	let last = new Date(data[0].createdAt).getTime();

	// Helper function to add a null entry
	const addNullEntry = (timestamp) => {
		formattedData.push({
			accessibility: "N/A",
			bestPractices: "N/A",
			performance: "N/A",
			seo: "N/A",
			createdAt: timestamp,
		});
	};

	data.forEach((entry) => {
		const current = new Date(entry.createdAt).getTime();
		if (current - last >= interval * 2) {
			// Insert null entries for each interval
			let temp = last + interval;
			while (temp < current) {
				addNullEntry(new Date(temp).toISOString());
				temp += interval;
			}
		}

		formattedData.push(entry);
		last = current;
	});
	return formattedData;
};

const createPagination = (data, timeRange) => {
	if (data.length === 0) return [];
	const paginatedData = [];
	let currentPage = [];
	let startTime = new Date(data[0].createdAt).getTime();
	let timeRangeMs = timeRange * 60 * 60 * 1000;
	data.forEach((entry) => {
		const entryTime = new Date(entry.createdAt).getTime();
		if (entryTime <= startTime + timeRangeMs) {
			currentPage.push(entry);
		} else {
			paginatedData.push(currentPage);
			currentPage = [entry];
			startTime = entryTime;
		}
	});

	if (currentPage.length > 0) {
		paginatedData.push(currentPage);
	}

	return paginatedData;
};

const PageSpeedAreaChart = ({ shouldRender, monitor, metrics, handleMetrics }) => {
	const theme = useTheme();
	const [page, setPage] = useState(0);
	const [timeRange, setTimeRange] = useState(2);

	const memoizedData = useMemo(() => {
		const data = monitor?.checks ? [...monitor.checks].reverse() : [];
		const interval = monitor?.interval ? monitor.interval : 180000;
		return processDataWithGaps(data, interval);
	}, [monitor?.checks, monitor?.interval]);

	const paginatedData = useMemo(
		() => createPagination(memoizedData, timeRange),
		[memoizedData, timeRange]
	);

	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeTimeRange = (event) => {
		setPage(0);
		setTimeRange(event.target.value);
	};

	return (
		<Stack
			direction="row"
			gap={theme.spacing(10)}
		>
			<ChartBox
				justifyContent="flex-start"
				icon={<ScoreIcon />}
				header="Score history"
				height="100%"
				borderRadiusRight={16}
				Legend={
					<AreaChartLegend
						metrics={metrics}
						handleMetrics={handleMetrics}
					/>
				}
			>
				<AreaChart
					data={paginatedData[page]}
					metrics={metrics}
				/>
				{paginatedData.length > 0 && paginatedData[page].length > 0 && (
					<Pagination
						page={page}
						pageCount={paginatedData.length}
						handleChangePage={handleChangePage}
						handleChangeTimeRange={handleChangeTimeRange}
						timeRange={timeRange}
						timeRangeLabel={[
							new Date(paginatedData[page][0].createdAt).getTime(),
							new Date(
								paginatedData[page][paginatedData[page].length - 1].createdAt
							).getTime(),
						]}
					/>
				)}
			</ChartBox>
		</Stack>
	);
};

PageSpeedAreaChart.propTypes = {
	shouldRender: PropTypes.bool,
	monitor: PropTypes.object,
	metrics: PropTypes.object,
	handleMetrics: PropTypes.func,
};

export default PageSpeedAreaChart;

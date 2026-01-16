import ChartBox from "@/Components/v1/Charts/ChartBox/index.jsx";
import PropTypes from "prop-types";
import Icon from "@/Components/v1/Icon";
import Table from "@/Components/v1/Table/index.jsx";
import TablePagination from "@/Components/v1/Table/TablePagination/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "../../../../../Utils/timeUtils.js";
import SkeletonLayout from "./skeleton.jsx";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { lighten, useTheme } from "@mui/material";

/**
 * Creates tooltip content with detailed timing breakdown
 * Following the pattern from IncidentTable's GetTooltip function
 * @param {Object} timings - Timing object (guaranteed to have phases by caller)
 * @param {Object} theme - MUI theme object
 * @param {Function} t - Translation function
 * @returns {JSX.Element} Tooltip content
 */
const GetTooltip = (timings, theme, t) => {
	const phases = timings.phases;
	const timingDetails = [
		{ label: t("dnsLookup"), value: phases.dns },
		{ label: t("tcpConnection"), value: phases.tcp },
		{ label: t("tlsHandshake"), value: phases.tls },
		{ label: t("waitTime"), value: phases.wait },
		{ label: t("timeToFirstByte"), value: phases.firstByte },
		{ label: t("download"), value: phases.download },
		{ label: t("total"), value: phases.total },
	].filter((item) => item.value > 0);

	return (
		<Stack
			sx={{
				py: theme.spacing(2),
				px: theme.spacing(4),
			}}
		>
			<Typography
				variant="body2"
				sx={{
					fontWeight: 600,
					marginBottom: theme.spacing(1),
					color: theme.palette.primary.contrastText,
				}}
			>
				{t("responseTimeBreakdown")}
			</Typography>
			{timingDetails.map((detail, index, array) => (
				<Box
					key={index}
					sx={{
						display: "flex",
						justifyContent: "space-between",
						gap: theme.spacing(4),
						marginBottom: index < array.length - 1 ? theme.spacing(0.5) : 0,
					}}
				>
					<Typography
						variant="body2"
						sx={{ color: theme.palette.primary.contrastText }}
					>
						{detail.label}:
					</Typography>
					<Typography
						variant="body2"
						sx={{
							fontWeight: index === array.length - 1 ? 600 : 400,
							color: theme.palette.primary.contrastText,
						}}
					>
						{Math.round(detail.value)} ms
					</Typography>
				</Box>
			))}
		</Stack>
	);
};

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
	const { t } = useTranslation();
	const theme = useTheme();

	if (isLoading) {
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
		{
			id: "responseTime",
			content: t("responseTime"),
			render: (row) => {
				const hasTimings = row.timings && row.timings.phases;
				const responseTime = row.responseTime;
				const responseTimeDisplay =
					responseTime !== null && responseTime !== undefined
						? `${Math.round(responseTime)} ms`
						: "N/A";

				if (!hasTimings) {
					return responseTimeDisplay;
				}

				return (
					<Tooltip
						title={GetTooltip(row.timings, theme, t)}
						placement="top"
						arrow
						enterDelay={300}
						enterNextDelay={300}
						slotProps={{
							tooltip: {
								sx: {
									backgroundColor: lighten(theme.palette.primary.main, 0.1),
									border: `1px solid ${theme.palette.primary.lowContrast}`,
									borderRadius: theme.shape.borderRadius,
									"& .MuiTooltip-arrow": {
										color: lighten(theme.palette.primary.main, 0.1),
										"&::before": {
											border: `1px solid ${theme.palette.primary.lowContrast}`,
										},
									},
								},
							},
						}}
					>
						<Box
							sx={{
								cursor: "help",
								display: "inline-block",
							}}
						>
							{responseTimeDisplay}
						</Box>
					</Tooltip>
				);
			},
		},
	];

	return (
		<ChartBox
			icon={
				<Icon
					name="History"
					size={20}
				/>
			}
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

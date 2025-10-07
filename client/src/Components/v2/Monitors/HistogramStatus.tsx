import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/v2/DesignElements";
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell } from "recharts";
import UptimeIcon from "@/assets/icons/uptime-icon.svg?react";
import IncidentsIcon from "@/assets/icons/incidents.svg?react";

import type { GroupedCheck } from "@/Types/Check";
import type { MonitorStatus } from "@/Types/Monitor";

import { useState } from "react";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { getResponseTimeColor } from "@/Utils/MonitorUtils";

const XLabel = ({
	p1,
	p2,
	range,
}: {
	p1: GroupedCheck;
	p2: GroupedCheck;
	range: string;
}) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state: any) => state.ui.timezone);
	const dateFormat = range === "day" ? "MMM D, h:mm A" : "MMM D";
	return (
		<>
			<text
				x={0}
				y="100%"
				dy={-3}
				textAnchor="start"
				fontSize={11}
				fill={theme.palette.primary.contrastTextTertiary}
			>
				{formatDateWithTz(p1._id, dateFormat, uiTimezone)}
			</text>
			<text
				x="100%"
				y="100%"
				dy={-3}
				textAnchor="end"
				fontSize={11}
				fill={theme.palette.primary.contrastTextTertiary}
			>
				{formatDateWithTz(p2._id, dateFormat, uiTimezone)}
			</text>
		</>
	);
};

type BaseChartProps = React.PropsWithChildren<{
	icon: React.ReactNode;
	title: string;
}>;

export const BaseChart: React.FC<BaseChartProps> = ({ children, icon, title }) => {
	const theme = useTheme();

	return (
		<BaseBox
			sx={{
				padding: theme.spacing(8),
				minWidth: 250,
				display: "flex",
				flex: 1,
			}}
		>
			<Stack
				gap={theme.spacing(8)}
				flex={1}
			>
				<Stack
					direction="row"
					alignItems={"center"}
					gap={theme.spacing(4)}
				>
					<BaseBox
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 34,
							height: 34,
							backgroundColor: theme.palette.tertiary.main,
							"& svg": {
								width: 20,
								height: 20,
								"& path": {
									stroke: theme.palette.primary.contrastTextTertiary,
								},
							},
						}}
					>
						{icon}
					</BaseBox>
					<Typography variant="h2">{title}</Typography>
				</Stack>
				<Box flex={1}>{children}</Box>
			</Stack>
		</BaseBox>
	);
};

export const HistogramStatus = ({
	checks,
	status,
	range,
	title,
}: {
	checks: GroupedCheck[];
	status: MonitorStatus;
	range: string;
	title: string;
}) => {
	const uiTimezone = useSelector((state: any) => state.ui.timezone);

	const icon = status === "up" ? <UptimeIcon /> : <IncidentsIcon />;
	const theme = useTheme();
	const [idx, setIdx] = useState<number | null>(null);
	const dateFormat = range === "1d" || range === "2h" ? "MMM D, h A" : "MMM D";

	if (checks.length === 0) {
		return (
			<BaseChart
				icon={icon}
				title={title}
			>
				<Stack
					height={"100%"}
					alignItems={"center"}
					justifyContent={"center"}
				>
					<Typography variant="h2">
						{status === "up" ? "No checks yet" : "Great, no downtime yet!"}
					</Typography>
				</Stack>
			</BaseChart>
		);
	}

	const totalChecks = checks.reduce((count, check) => {
		return count + check.count;
	}, 0);

	return (
		<BaseChart
			icon={icon}
			title={title}
		>
			<Stack gap={theme.spacing(8)}>
				<Stack
					position="relative"
					direction="row"
					justifyContent="space-between"
				>
					<Stack>
						<Typography>Total checks</Typography>
						{idx ? (
							<Stack>
								<Typography variant="h2">{checks[idx].count}</Typography>
								<Typography
									position={"absolute"}
									top={"100%"}
								>
									{formatDateWithTz(checks[idx]._id, dateFormat, uiTimezone)}
								</Typography>
							</Stack>
						) : (
							<Typography variant="h2">{totalChecks}</Typography>
						)}
					</Stack>
				</Stack>
				<ResponsiveContainer
					width="100%"
					height={155}
				>
					<BarChart data={checks}>
						<XAxis
							stroke={theme.palette.primary.lowContrast}
							height={15}
							tick={false}
							label={
								<XLabel
									p1={checks[0]}
									p2={checks[checks.length - 1]}
									range={range}
								/>
							}
						/>
						<Bar
							dataKey="avgResponseTime"
							maxBarSize={7}
							background={{ fill: "transparent" }}
						>
							{checks?.map((groupedCheck, idx) => {
								const fillColor = getResponseTimeColor(groupedCheck.avgResponseTime);
								return (
									<Cell
										onMouseEnter={() => setIdx(idx)}
										onMouseLeave={() => setIdx(null)}
										key={groupedCheck._id}
										fill={theme.palette[fillColor].main}
									/>
								);
							})}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</Stack>
		</BaseChart>
	);
};

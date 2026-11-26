import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/Components/design-elements";
import { useTheme } from "@mui/material/styles";
import {
	formatMs,
	tooltipBucketDate,
	tooltipDateFormatLookup,
	type DateFormat,
} from "@/Utils/TimeUtils";
import { useTranslation } from "react-i18next";
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell, Tooltip } from "recharts";
import { getResponseTimeColor } from "@/Utils/MonitorUtils";
import type { GroupedCheck } from "@/Types/Check";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { formatNumber } from "@/Utils/FormatUtils";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

type HistogramStatusMetric = "responseTime" | "checkCount";

const BOUND_LABEL_FORMATS: Record<string, DateFormat> = {
	day: "dateTimeShort",
	year: "date",
	all: "date",
};

interface XLabelProps {
	p1: GroupedCheck;
	p2: GroupedCheck;
	range: string;
}

const XLabel = ({ p1, p2, range }: XLabelProps) => {
	const theme = useTheme();
	const formatDate = useFormatDate();
	const dateFormat = BOUND_LABEL_FORMATS[range] ?? "dateShort";
	return (
		<>
			<text
				x={0}
				y="100%"
				dy={-3}
				textAnchor="start"
				fontSize={typographyLevels.s}
				fill={theme.palette.neutral.tertiary}
			>
				{formatDate(p1.bucketDate, dateFormat)}
			</text>
			<text
				x="100%"
				y="100%"
				dy={-3}
				textAnchor="end"
				fontSize={typographyLevels.s}
				fill={theme.palette.neutral.tertiary}
			>
				{formatDate(p2.bucketDate, dateFormat)}
			</text>
		</>
	);
};

interface HistogramStatusProps {
	title: string;
	icon: React.ReactNode;
	checks?: GroupedCheck[];
	range: string;
	metric?: HistogramStatusMetric;
	countColor?: PaletteKey;
}

export const HistogramStatus = ({
	title,
	icon,
	checks = [],
	range,
	metric = "responseTime",
	countColor = "success",
}: HistogramStatusProps) => {
	const isCheckCount = metric === "checkCount";
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const barRadius = Number(theme.shape.borderRadius);
	const formatDate = useFormatDate();
	const CustomTooltip = ({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: Array<{ payload: GroupedCheck }>;
	}) => {
		if (!active || !payload?.length) return null;
		const d = payload[0]?.payload;
		const valueText = isCheckCount
			? formatNumber(d?.totalChecks ?? 0, { locale: i18n.resolvedLanguage })
			: formatMs(d?.avgResponseTime ?? 0);
		const titleText = isCheckCount
			? t("common.charts.labels.checkCount")
			: t("common.charts.labels.averageResponseTime");
		let dateLabel = "";
		if (d?.bucketDate) {
			dateLabel = formatDate(
				tooltipBucketDate(d.bucketDate, range),
				tooltipDateFormatLookup(range)
			);
		}
		return (
			<Stack
				p={SPACING.SM}
				bgcolor={theme.palette.background.paper}
				border={1}
				borderColor={theme.palette.divider}
				borderRadius={theme.shape.borderRadius}
			>
				{dateLabel ? (
					<Typography
						color={theme.palette.text.secondary}
						variant="caption"
					>
						{dateLabel}
					</Typography>
				) : null}
				<Typography variant="caption">{titleText}</Typography>
				<Typography variant="body2">{valueText}</Typography>
			</Stack>
		);
	};

	const totalChecks = checks.reduce((acc, check) => acc + (check.totalChecks || 0), 0);

	return (
		<BaseChart
			icon={icon}
			title={title}
		>
			<Stack gap={theme.spacing(LAYOUT.MD)}>
				<Stack
					position="relative"
					direction="row"
					justifyContent="space-between"
				>
					<Stack>
						<Typography>Total checks: {totalChecks}</Typography>
					</Stack>
				</Stack>
				<ResponsiveContainer
					width="100%"
					height={155}
				>
					<BarChart data={checks}>
						<XAxis
							stroke={theme.palette.divider}
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
						<Tooltip
							cursor={false}
							content={<CustomTooltip />}
						/>
						<Bar
							dataKey={isCheckCount ? "totalChecks" : "avgResponseTime"}
							maxBarSize={7}
							radius={[barRadius, barRadius, 0, 0]}
							background={{ fill: "transparent" }}
						>
							{checks?.map((groupedCheck, index) => {
								const fillColor = isCheckCount
									? countColor
									: getResponseTimeColor(groupedCheck.avgResponseTime);
								return (
									<Cell
										key={groupedCheck.bucketDate || `check-${index}`}
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

import { type DateFormat } from "@/Utils/TimeUtils";
import { Text } from "recharts";
import { useTheme } from "@mui/material";
import { useFormatDate } from "@/Hooks/useFormatDate";

const TICK_FORMATS: Record<string, DateFormat> = {
	recent: "time",
	day: "time",
	week: "dateTimeShort",
	month: "dateShort",
};

type XTickProps = {
	x: number;
	y: number;
	payload: { value: string };
	range: string;
};

export const XTick = ({ x, y, payload, range }: XTickProps) => {
	const theme = useTheme();
	const formatDate = useFormatDate();
	return (
		<Text
			x={x}
			y={y + 10}
			textAnchor="middle"
			fill={theme.palette.text.secondary}
			fontSize={11}
			fontWeight={400}
		>
			{formatDate(payload?.value, TICK_FORMATS[range] ?? "dateTimeShort")}
		</Text>
	);
};

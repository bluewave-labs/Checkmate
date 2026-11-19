import { type DateFormat } from "@/Utils/TimeUtils";
import { Text } from "recharts";
import { useTheme } from "@mui/material";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { typographyLevels } from "@/Utils/Theme/Palette";

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
			fill={theme.palette.neutral.tertiary}
			fontSize={typographyLevels.s}
			fontWeight={400}
		>
			{formatDate(payload?.value, TICK_FORMATS[range] ?? "dateTimeShort")}
		</Text>
	);
};

import { formatDateWithTz, tickDateFormatLookup } from "@/Utils/TimeUtils";
import { useSelector } from "react-redux";
import { Text } from "recharts";
import { useTheme } from "@mui/material";
import type { RootState } from "@/Types/state";

type XTickProps = {
	x: number;
	y: number;
	payload: { value: string };
	range: string;
};

export const XTick = ({ x, y, payload, range }: XTickProps) => {
	const format = tickDateFormatLookup(range);
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	return (
		<Text
			x={x}
			y={y + 10}
			textAnchor="middle"
			fill={theme.palette.text.secondary}
			fontSize={11}
			fontWeight={400}
		>
			{formatDateWithTz(payload?.value, format, uiTimezone)}
		</Text>
	);
};

import Box from "@mui/material/Box";
import { useMemo } from "react";

import type { CheckSnapshot } from "@/Types/Check";

const VIEWBOX_WIDTH = 100;
// The svg renders at its viewBox height, so one constant serves both.
const VIEWBOX_HEIGHT = 24;
// Matches the 1.5 stroke the shared Icon component uses.
const STROKE_WIDTH = 1.5;

/**
 * Response times as a bare polyline. Deliberately axis-free and label-free —
 * at this size the shape is the only readable signal.
 *
 * `checks` arrives oldest-first, which is already left-to-right reading order.
 */
export const Sparkline = ({
	checks,
	color,
}: {
	checks: CheckSnapshot[];
	color: string;
}) => {
	const points = useMemo(() => {
		const values = checks
			.map((check) => check.responseTime)
			.filter((value): value is number => typeof value === "number");

		if (values.length < 2) {
			return null;
		}

		const max = Math.max(...values);
		const min = Math.min(...values);
		const span = max - min || 1;

		return values
			.map((value, index) => {
				const x = (index / (values.length - 1)) * VIEWBOX_WIDTH;
				const y = VIEWBOX_HEIGHT - ((value - min) / span) * VIEWBOX_HEIGHT;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(" ");
	}, [checks]);

	if (!points) {
		return null;
	}

	return (
		<Box
			component="svg"
			viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
			preserveAspectRatio="none"
			aria-hidden="true"
			width="100%"
			height={VIEWBOX_HEIGHT}
			display="block"
		>
			<polyline
				points={points}
				fill="none"
				stroke={color}
				strokeWidth={STROKE_WIDTH}
				strokeLinejoin="round"
				strokeLinecap="round"
				vectorEffect="non-scaling-stroke"
			/>
		</Box>
	);
};

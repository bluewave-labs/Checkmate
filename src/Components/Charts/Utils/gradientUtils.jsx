/**
 * Creates an SVG gradient definition for use in charts
 * @param {Object} params - The gradient parameters
 * @param {string} [params.id="colorUv"] - Unique identifier for the gradient
 * @param {string} params.startColor - Starting color of the gradient (hex, rgb, or color name)
 * @param {string} params.endColor - Ending color of the gradient (hex, rgb, or color name)
 * @param {number} [params.startOpacity=0.8] - Starting opacity (0-1)
 * @param {number} [params.endOpacity=0] - Ending opacity (0-1)
 * @param {('vertical'|'horizontal')} [params.direction="vertical"] - Direction of the gradient
 * @returns {JSX.Element} SVG gradient definition element
 * @example
 * createCustomGradient({
 *   startColor: "#1976D2",
 *   endColor: "#42A5F5",
 *   direction: "horizontal"
 * })
 */

export const createGradient = ({
	id,
	startColor,
	endColor,
	startOpacity = 0.8,
	endOpacity = 0,
	direction = "vertical", // or "horizontal"
}) => (
	<defs>
		<linearGradient
			id={id}
			x1={direction === "vertical" ? "0" : "0"}
			y1={direction === "vertical" ? "0" : "0"}
			x2={direction === "vertical" ? "0" : "1"}
			y2={direction === "vertical" ? "1" : "0"}
		>
			<stop
				offset="0%"
				stopColor={startColor}
				stopOpacity={startOpacity}
			/>
			<stop
				offset="100%"
				stopColor={endColor}
				stopOpacity={endOpacity}
			/>
		</linearGradient>
	</defs>
);

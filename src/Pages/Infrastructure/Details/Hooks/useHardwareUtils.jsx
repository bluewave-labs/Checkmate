import { Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

// Constants
const BASE_BOX_PADDING_VERTICAL = 4;
const BASE_BOX_PADDING_HORIZONTAL = 8;
const TYPOGRAPHY_PADDING = 8;
const CHART_CONTAINER_HEIGHT = 300;

const useHardwareUtils = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const getDimensions = () => {
		const totalTypographyPadding = parseInt(theme.spacing(TYPOGRAPHY_PADDING), 10) * 2;
		const totalChartContainerPadding =
			parseInt(theme.spacing(BASE_BOX_PADDING_VERTICAL), 10) * 2;
		return {
			baseBoxPaddingVertical: BASE_BOX_PADDING_VERTICAL,
			baseBoxPaddingHorizontal: BASE_BOX_PADDING_HORIZONTAL,
			totalContainerPadding: parseInt(theme.spacing(BASE_BOX_PADDING_VERTICAL), 10) * 2,
			areaChartHeight:
				CHART_CONTAINER_HEIGHT - totalChartContainerPadding - totalTypographyPadding,
		};
	};

	const formatBytes = (bytes, space = false) => {
		if (bytes === undefined || bytes === null)
			return (
				<>
					{0}
					{space ? " " : ""}
					<Typography component="span">{t("gb")}</Typography>
				</>
			);
		if (typeof bytes !== "number")
			return (
				<>
					{0}
					{space ? " " : ""}
					<Typography component="span">{t("gb")}</Typography>
				</>
			);
		if (bytes === 0)
			return (
				<>
					{0}
					{space ? " " : ""}
					<Typography component="span">{t("gb")}</Typography>
				</>
			);

		const GB = bytes / (1024 * 1024 * 1024);
		const MB = bytes / (1024 * 1024);

		if (GB >= 1) {
			return (
				<>
					{Number(GB.toFixed(0))}
					{space ? " " : ""}
					<Typography component="span">{t("gb")}</Typography>
				</>
			);
		} else {
			return (
				<>
					{Number(MB.toFixed(0))}
					{space ? " " : ""}
					<Typography component="span">{t("mb")}</Typography>
				</>
			);
		}
	};

	/**
	 * Converts a decimal value to a percentage
	 *
	 * @function decimalToPercentage
	 * @param {number} value - Decimal value to convert
	 * @returns {number} Percentage representation
	 *
	 * @example
	 * decimalToPercentage(0.75)  // Returns 75
	 * decimalToPercentage(null)  // Returns 0
	 */
	const decimalToPercentage = (value) => {
		if (value === null || value === undefined) return 0;
		return value * 100;
	};

	const buildTemps = (checks) => {
		let numCores = 1;
		if (checks === null) return { temps: [], tempKeys: [] };

		for (const check of checks) {
			if (check?.avgTemperature?.length > numCores) {
				numCores = check.avgTemperature.length;
				break;
			}
		}
		const temps = checks.map((check) => {
			// If there's no data, set the temperature to 0
			if (
				check?.avgTemperature?.length === 0 ||
				check?.avgTemperature === undefined ||
				check?.avgTemperature === null
			) {
				check.avgTemperature = Array(numCores).fill(0);
			}
			const res = check?.avgTemperature?.reduce(
				(acc, cur, idx) => {
					acc[`core${idx + 1}`] = cur;
					return acc;
				},
				{
					_id: check._id,
				}
			);
			return res;
		});
		if (temps.length === 0 || !temps[0]) {
			return { temps: [], tempKeys: [] };
		}

		return {
			tempKeys: Object.keys(temps[0] || {}).filter((key) => key !== "_id"),
			temps,
		};
	};

	return {
		formatBytes,
		decimalToPercentage,
		buildTemps,
		getDimensions,
	};
};

export { useHardwareUtils };

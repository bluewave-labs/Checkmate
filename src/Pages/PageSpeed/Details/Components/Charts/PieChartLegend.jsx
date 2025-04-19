import { Stack, Box, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import LegendBox from "../../../../../Components/Charts/LegendBox";
import SpeedometerIcon from "../../../../../assets/icons/speedometer-icon.svg?react";
import PropTypes from "prop-types";

const PieChartLegend = ({ audits }) => {
	const theme = useTheme();

	return (
		<LegendBox
			icon={<SpeedometerIcon />}
			header="Performance metrics"
			sx={{ flex: 1 }}
		>
			{typeof audits !== "undefined" &&
				Object.keys(audits).map((key) => {
					if (key === "_id") return;

					let audit = audits[key];
					let score = audit.score * 100;
					let bg =
						score >= 90
							? theme.palette.success.main
							: score >= 50
								? theme.palette.warning.main
								: score >= 0
									? theme.palette.error.main
									: theme.palette.tertiary.main;

					// Find the position where the number ends and the unit begins
					const match = audit.displayValue.match(/(\d+\.?\d*)\s*([a-zA-Z]+)/);
					let value;
					let unit;
					if (match) {
						value = match[1];
						match[2] === "s" ? (unit = "seconds") : (unit = match[2]);
					} else {
						value = audit.displayValue;
					}

					return (
						<Stack
							flex={1}
							key={`${key}-box`}
							justifyContent="space-between"
							direction="row"
							gap={theme.spacing(4)}
							p={theme.spacing(3)}
							border={1}
							borderColor={theme.palette.primary.lowContrast}
							borderRadius={4}
						>
							<Box>
								<Typography
									fontSize={12}
									fontWeight={500}
									lineHeight={1}
									mb={1}
									textTransform="uppercase"
								>
									{audit.title}
								</Typography>
								<Typography
									component="span"
									fontSize={14}
									fontWeight={500}
									color={theme.palette.primary.contrastText}
								>
									{value}
									<Typography
										component="span"
										variant="body2"
										ml={2}
									>
										{unit}
									</Typography>
								</Typography>
							</Box>
							<Box
								width={4}
								backgroundColor={bg}
								borderRadius={4}
							/>
						</Stack>
					);
				})}
		</LegendBox>
	);
};

PieChartLegend.propTypes = {
	audits: PropTypes.object,
};

export default PieChartLegend;

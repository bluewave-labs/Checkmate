import { Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import IconBox from "../../IconBox";
import PropTypes from "prop-types";

const ChartBox = ({
	children,
	icon,
	header,
	height = "300px",
	justifyContent = "space-between",
	Legend,
	borderRadiusRight = 4,
}) => {
	const theme = useTheme();
	return (
		<Stack
			flex={1}
			direction="row"
			sx={{
				backgroundColor: theme.palette.primary.main,

				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.primary.lowContrast,
				borderRadius: 2,
				borderTopRightRadius: borderRadiusRight,
				borderBottomRightRadius: borderRadiusRight,
			}}
		>
			<Stack
				flex={1}
				alignItems="center"
				sx={{
					padding: theme.spacing(8),
					justifyContent,
					gap: theme.spacing(8),
					height,
					minWidth: 250,
					"& h2": {
						color: theme.palette.primary.contrastTextSecondary,
						fontSize: 15,
						fontWeight: 500,
					},
					"& .MuiBox-root:not(.area-tooltip) p": {
						color: theme.palette.primary.contrastTextTertiary,
						fontSize: 13,
					},
					"& .MuiBox-root > span": {
						color: theme.palette.primary.contrastText,
						fontSize: 20,
						"& span": {
							opacity: 0.8,
							marginLeft: 2,
							fontSize: 15,
						},
					},

					"& tspan, & text": {
						fill: theme.palette.primary.contrastTextTertiary,
					},
					"& path": {
						transition: "fill 300ms ease, stroke-width 400ms ease",
					},
				}}
			>
				<Stack
					alignSelf="flex-start"
					direction="row"
					alignItems="center"
					gap={theme.spacing(6)}
				>
					<IconBox>{icon}</IconBox>
					<Typography component="h2">{header}</Typography>
				</Stack>
				{children}
			</Stack>
			{Legend && Legend}
		</Stack>
	);
};

export default ChartBox;

ChartBox.propTypes = {
	children: PropTypes.node,
	icon: PropTypes.node.isRequired,
	header: PropTypes.string.isRequired,
	height: PropTypes.string,
};

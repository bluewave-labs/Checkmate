import { Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import IconBox from "../../IconBox";
import EmptyView from "./EmptyView";
import PropTypes from "prop-types";

const ChartBox = ({
	children,
	icon,
	header,
	height = "300px",
	justifyContent = "space-between",
	Legend,
	borderRadiusRight = 4,
	sx,
	noDataMessage,
	isEmpty = false,
}) => {
	const theme = useTheme();
	if (isEmpty) {
		return <EmptyView icon={icon} header={header} message={noDataMessage} />; 
	}
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
					{icon && <IconBox>{icon}</IconBox>}
					{header && <Typography component="h2">{header}</Typography>}
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
	icon: PropTypes.node,
	header: PropTypes.string,
	height: PropTypes.string,
	noDataMessage: PropTypes.string,
	isEmpty: PropTypes.bool
};

import IconButton from "@mui/material/IconButton";
import ArrowRight from "../../assets/icons/right-arrow.svg?react";
import ArrowLeft from "../../assets/icons/left-arrow.svg?react";
import { useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "../../Features/UI/uiSlice";

const CollapseButton = ({ collapsed }) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	return (
		<IconButton
			sx={{
				position: "absolute",
				/* TODO 60 is a magic number. if logo chnges size this might break */
				top: 60,
				right: 0,
				transform: `translate(50%, 0)`,
				backgroundColor: theme.palette.tertiary.main,
				border: 1,
				borderColor: theme.palette.primary.lowContrast,
				p: theme.spacing(2.5),
				"& svg": {
					width: theme.spacing(8),
					height: theme.spacing(8),
					"& path": {
						stroke: theme.palette.primary.contrastTextSecondary,
					},
				},
				"&:focus": { outline: "none" },
				"&:hover": {
					backgroundColor: theme.palette.primary.lowContrast,
					borderColor: theme.palette.primary.lowContrast,
				},
			}}
			onClick={() => {
				dispatch(toggleSidebar());
			}}
		>
			{collapsed ? <ArrowRight /> : <ArrowLeft />}
		</IconButton>
	);
};

export default CollapseButton;

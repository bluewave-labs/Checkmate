import { Grid } from "@mui/material";
import Card from "../Card/index.jsx";

const MonitorGrid = ({ monitors, shouldRender = true }) => {
	if (!shouldRender) return null;

	return (
		<Grid
			container
			spacing={12}
		>
			{monitors?.map((monitor) => (
				<Card
					monitor={monitor}
					key={monitor._id || monitor.id}
				/>
			))}
		</Grid>
	);
};

export default MonitorGrid;

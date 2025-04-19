import { Grid, Grid2 } from "@mui/material";
import Card from "../Card";

const MonitorGrid = ({ shouldRender, monitors }) => {
	return (
		<Grid
			container
			spacing={12}
		>
			{monitors?.map((monitor) => (
				<Card
					monitor={monitor}
					key={monitor._id}
				/>
			))}
		</Grid>
	);
};

export default MonitorGrid;

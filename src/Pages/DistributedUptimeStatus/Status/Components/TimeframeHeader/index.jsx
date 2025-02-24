import { Stack, Button, ButtonGroup } from "@mui/material";
import { RowContainer } from "../../../../../Components/StandardContainer";
import { useTheme } from "@emotion/react";

const TimeFrameHeader = ({ timeFrame, setTimeFrame }) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			justifyContent="flex-end"
		>
			<ButtonGroup>
				<Button
					variant="group"
					filled={(timeFrame === 30).toString()}
					onClick={() => setTimeFrame(30)}
				>
					30 days
				</Button>
				<Button
					variant="group"
					filled={(timeFrame === 60).toString()}
					onClick={() => setTimeFrame(60)}
				>
					60 days
				</Button>
				<Button
					variant="group"
					filled={(timeFrame === 90).toString()}
					onClick={() => setTimeFrame(90)}
				>
					90 days
				</Button>
			</ButtonGroup>
		</Stack>
	);
};

export default TimeFrameHeader;

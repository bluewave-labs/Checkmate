import { Stack, Button, ButtonGroup } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const TimeFrameHeader = ({ timeFrame, setTimeFrame, sx, ...props }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			direction="row"
			justifyContent="flex-end"
			sx={{ ...sx }}
			{...props}
		>
			<ButtonGroup>
				<Button
					variant="group"
					filled={(timeFrame === 30).toString()}
					onClick={() => setTimeFrame(30)}
				>
					{t("distributedUptimeStatus30Days")}
				</Button>
				<Button
					variant="group"
					filled={(timeFrame === 60).toString()}
					onClick={() => setTimeFrame(60)}
				>
					{t("distributedUptimeStatus60Days")}
				</Button>
				<Button
					variant="group"
					filled={(timeFrame === 90).toString()}
					onClick={() => setTimeFrame(90)}
				>
					{t("distributedUptimeStatus90Days")}
				</Button>
			</ButtonGroup>
		</Stack>
	);
};

export default TimeFrameHeader;

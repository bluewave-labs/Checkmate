import { LinearProgress } from "@mui/material";
import { useState, useEffect } from "react";

const NextExpectedCheck = ({ lastUpdateTime, interval, trigger }) => {
	const [elapsedMs, setElapsedMs] = useState(lastUpdateTime);

	useEffect(() => {
		setElapsedMs(lastUpdateTime);
		const timer = setInterval(() => {
			setElapsedMs((prev) => {
				const newElapsedMs = prev + 100;
				return newElapsedMs;
			});
		}, 100);
		return () => clearInterval(timer);
	}, [interval, trigger]);

	return (
		<LinearProgress
			variant="determinate"
			color="accent"
			value={Math.min((elapsedMs / interval) * 100, 100)}
			sx={{
				transition: "width 1s linear", // Smooth transition over 1 second
			}}
		/>
	);
};

export default NextExpectedCheck;

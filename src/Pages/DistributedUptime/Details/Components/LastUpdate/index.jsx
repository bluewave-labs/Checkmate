import { useState, useEffect } from "react";
const LastUpdate = ({ suffix, lastUpdateTime, trigger }) => {
	const [elapsedMs, setElapsedMs] = useState(lastUpdateTime);

	useEffect(() => {
		setElapsedMs(lastUpdateTime);
		const timer = setInterval(() => {
			setElapsedMs((prev) => prev + 1000);
		}, 1000);
		return () => clearInterval(timer);
	}, [lastUpdateTime, trigger]);

	return `${Math.floor(elapsedMs / 1000)} ${suffix}`;
};
export default LastUpdate;

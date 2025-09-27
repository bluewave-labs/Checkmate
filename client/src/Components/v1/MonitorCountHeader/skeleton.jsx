import { Stack, Skeleton } from "@mui/material";
import { useTheme } from "@emotion/react";

const SkeletonLayout = () => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(2)}
		>
			<Skeleton
				variant="text"
				width={100}
				height={32}
			/>
			<Skeleton
				variant="circular"
				width={40}
				height={40}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

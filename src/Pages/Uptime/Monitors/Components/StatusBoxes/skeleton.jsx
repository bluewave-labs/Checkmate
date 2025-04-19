import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@emotion/react";

const SkeletonLayout = () => {
	const theme = useTheme();
	return (
		<Stack
			gap={theme.spacing(12)}
			direction="row"
			justifyContent="space-between"
		>
			<Skeleton
				variant="rounded"
				width="100%"
				height={100}
			/>
			<Skeleton
				variant="rounded"
				width="100%"
				height={100}
			/>
			<Skeleton
				variant="rounded"
				width="100%"
				height={100}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

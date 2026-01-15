import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@emotion/react";

const SkeletonLayout = () => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
		>
			<Skeleton
				variant="rounded"
				width="100%"
				height={300}
			/>
			<Skeleton
				variant="rounded"
				width="100%"
				height={300}
			/>
			<Skeleton
				variant="rounded"
				width="100%"
				height={300}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

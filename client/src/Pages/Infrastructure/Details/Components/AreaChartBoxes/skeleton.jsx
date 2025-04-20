import { Stack, Skeleton } from "@mui/material";
import { useTheme } from "@emotion/react";
const SkeletonLayout = () => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			flexWrap="wrap"
			gap={theme.spacing(8)}
		>
			<Skeleton
				height={"33vh"}
				sx={{
					flex: 1,
				}}
			/>
			<Skeleton
				height={"33vh"}
				sx={{ flex: 1 }}
			/>
		</Stack>
	);
};

export default SkeletonLayout;

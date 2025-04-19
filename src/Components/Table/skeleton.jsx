import { Skeleton } from "@mui/material";

const TableSkeleton = () => {
	return (
		<Skeleton
			variant="rounded"
			width="100%"
			height="80%"
			flex={1}
		/>
	);
};

export default TableSkeleton;

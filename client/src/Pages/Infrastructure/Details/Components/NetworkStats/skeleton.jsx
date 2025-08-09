import {
	Card,
	CardContent,
	Skeleton,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from "@mui/material";

const SkeletonLayout = () => {
	return (
		<Card>
			<CardContent>
				<Skeleton
					variant="text"
					width={180}
					height={32}
				/>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Bytes Sent</TableCell>
							<TableCell>Bytes Received</TableCell>
							<TableCell>Packets Sent</TableCell>
							<TableCell>Packets Received</TableCell>
							<TableCell>Errors In</TableCell>
							<TableCell>Errors Out</TableCell>
							<TableCell>Drops In</TableCell>
							<TableCell>Drops Out</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{Array.from({ length: 5 }).map((_, idx) => (
							<TableRow key={idx}>
								{Array.from({ length: 9 }).map((__, colIdx) => (
									<TableCell key={colIdx}>
										<Skeleton
											variant="text"
											width={80}
											height={24}
										/>
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
};

export default SkeletonLayout;

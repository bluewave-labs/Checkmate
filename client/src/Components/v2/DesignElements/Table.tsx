import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

export type Header<T> = {
	id: number | string;
	content: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLTableCellElement | null>, row: T) => void;
	render: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id?: string | number; _id?: string | number }> = {
	headers: Header<T>[];
	data: T[];
};

export function DataTable<T extends { id?: string | number; _id?: string | number }>({
	headers,
	data,
}: DataTableProps<T>) {
	if (data.length === 0 || headers.length === 0) return <div>No data</div>;
	return (
		<TableContainer component={Paper}>
			<Table stickyHeader>
				<TableHead>
					<TableRow>
						{headers.map((header, idx) => {
							return (
								<TableCell
									align={idx === 0 ? "left" : "center"}
									key={header.id}
								>
									{header.content}
								</TableCell>
							);
						})}
					</TableRow>
				</TableHead>
				<TableBody>
					{data.map((row) => {
						const key = row.id || row._id || Math.random();

						return (
							<TableRow key={key}>
								{headers.map((header, index) => {
									return (
										<TableCell
											align={index === 0 ? "left" : "center"}
											key={header.id}
											onClick={
												header.onClick ? (e) => header.onClick!(e, row) : undefined
											}
										>
											{header.render(row)}
										</TableCell>
									);
								})}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

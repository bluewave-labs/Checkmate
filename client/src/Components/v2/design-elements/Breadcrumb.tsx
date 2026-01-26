import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { ChevronRight } from "lucide-react";

const isId = (segment: string): boolean => {
	return segment.length === 24 || /^[a-f0-9-]{36}$/.test(segment);
};

export const Breadcrumb = () => {
	const theme = useTheme();
	const location = useLocation();

	const segments = location.pathname.split("/").filter((x) => x);

	// Build simplified breadcrumb: "uptime" or "uptime / details"
	const basePage = segments[0] || "home";
	const hasDetailsPage = segments.length > 1 && isId(segments[1]);

	return (
		<MuiBreadcrumbs
			separator={
				<ChevronRight
					size={16}
					strokeWidth={1.5}
				/>
			}
			sx={{
				fontSize: "14px",
				marginBottom: theme.spacing(6),
				"& .MuiBreadcrumbs-separator": {
					color: theme.palette.text.secondary,
				},
			}}
		>
			{hasDetailsPage ? (
				<Link
					to={`/${basePage}`}
					style={{ textDecoration: "none" }}
				>
					<Typography
						sx={{
							fontSize: "14px",
							color: theme.palette.text.secondary,
							"&:hover": {
								color: theme.palette.primary.main,
							},
						}}
					>
						{basePage.charAt(0).toUpperCase() + basePage.slice(1)}
					</Typography>
				</Link>
			) : (
				<Typography
					sx={{
						fontSize: "14px",
						fontWeight: 600,
						color: theme.palette.primary.main,
					}}
				>
					{basePage.charAt(0).toUpperCase() + basePage.slice(1)}
				</Typography>
			)}
			{hasDetailsPage && (
				<Typography
					sx={{
						fontSize: "14px",
						fontWeight: 600,
						color: theme.palette.primary.main,
					}}
				>
					Details
				</Typography>
			)}
		</MuiBreadcrumbs>
	);
};

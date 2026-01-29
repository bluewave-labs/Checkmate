import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { ChevronRight } from "lucide-react";

const isId = (segment: string): boolean => {
	return segment.length === 24 || /^[a-f0-9-]{36}$/.test(segment);
};

const actionSegments = ["create", "configure"];

export const Breadcrumb = () => {
	const theme = useTheme();
	const location = useLocation();

	const segments = location.pathname.split("/").filter((x) => x);

	// Build simplified breadcrumb: "uptime" or "uptime / details" or "uptime / create"
	const basePage = segments[0] || "home";

	const secondSegment = segments[1];
	const isActionPage = secondSegment && actionSegments.includes(secondSegment); // create/config
	const isDetailsPage = secondSegment && isId(secondSegment); // details
	const hasSubPage = isActionPage || isDetailsPage;

	const getSubPageLabel = (): string => {
		if (isActionPage) {
			return secondSegment.charAt(0).toUpperCase() + secondSegment.slice(1);
		}
		return "Details";
	};

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
			{hasSubPage ? (
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
			{hasSubPage && (
				<Typography
					sx={{
						fontSize: "14px",
						fontWeight: 600,
						color: theme.palette.primary.main,
					}}
				>
					{getSubPageLabel()}
				</Typography>
			)}
		</MuiBreadcrumbs>
	);
};

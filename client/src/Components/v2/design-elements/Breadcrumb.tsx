import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

const isId = (segment: string): boolean => {
	return segment.length === 24 || /^[a-f0-9-]{36}$/.test(segment);
};

const actionSegments = ["create", "configure"];

const BreadcrumbWrapper = ({ children }: { children: ReactNode }) => {
	const theme = useTheme();
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
			{children}
		</MuiBreadcrumbs>
	);
};

export const Breadcrumb = ({
	breadcrumbOverride,
}: {
	breadcrumbOverride?: string[] | undefined;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const location = useLocation();

	// If override is an empty array, hide entirely
	if (breadcrumbOverride !== undefined && breadcrumbOverride.length === 0) {
		return null;
	}

	// If override has items, render them directly
	if (breadcrumbOverride !== undefined && breadcrumbOverride.length > 0) {
		return (
			<BreadcrumbWrapper>
				{breadcrumbOverride.map((item, index) => {
					const isLast = index === breadcrumbOverride.length - 1;
					return (
						<Typography
							key={index}
							sx={{
								fontSize: "14px",
								fontWeight: isLast ? 600 : 400,
								color: isLast ? theme.palette.primary.main : theme.palette.text.secondary,
							}}
						>
							{item}
						</Typography>
					);
				})}
			</BreadcrumbWrapper>
		);
	}

	// Default behavior: use location pathname
	const segments = location.pathname.split("/").filter((x) => x);

	if (segments.length === 0) {
		return null;
	}

	// Build simplified breadcrumb: "uptime" or "uptime / details" or "uptime / create"
	const basePage = segments[0] || t("common.breadcrumbs.home");

	const secondSegment = segments[1];
	const isActionPage = secondSegment && actionSegments.includes(secondSegment);
	const isDetailsPage = secondSegment && isId(secondSegment);
	const hasSubPage = isActionPage || isDetailsPage;

	const getSubPageLabel = (): string => {
		if (isActionPage) {
			return secondSegment.charAt(0).toUpperCase() + secondSegment.slice(1);
		}
		return t("common.breadcrumbs.details");
	};

	return (
		<BreadcrumbWrapper>
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
		</BreadcrumbWrapper>
	);
};

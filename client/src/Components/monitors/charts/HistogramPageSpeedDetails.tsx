import { BaseChart, Icon } from "@/Components/design-elements";
import { TrendingUp } from "lucide-react";
import { XTick } from "@/Components/monitors/charts/XTick";
import { XAxis, AreaChart, Area, Tooltip, CartesianGrid } from "recharts";
import { HistogramPageSpeedScoresTooltip } from "@/Components/monitors";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { typographyLevels, fontWeights } from "@/Utils/Theme/Palette";
import { SPACING } from "@/Utils/Theme/constants";

import { useTheme } from "@mui/material/styles";
import type { PageSpeedGroupedCheck } from "@/Types/Check";
import type { Palette } from "@mui/material/styles";
type PaletteColorKey = Extract<
	keyof Palette,
	"primary" | "error" | "success" | "warning"
>;

export interface ConfigItem {
	id: string;
	text: string;
	palette: PaletteColorKey;
}

const config: Record<string, ConfigItem> = {
	seo: {
		id: "seo",
		text: "SEO",
		palette: "primary",
	},
	performance: {
		id: "performance",
		text: "performance",
		palette: "success",
	},
	bestPractices: {
		id: "bestPractices",
		text: "best practices",
		palette: "warning",
	},
	accessibility: {
		id: "accessibility",
		text: "accessibility",
		palette: "error",
	},
};

const POINT_WIDTH = 48;
const MIN_CONTAINER_WIDTH = 600;

export const HistogramPageSpeedDetails = ({
	checks,
	range,
	hasMoreBefore = false,
	hasMoreAfter = false,
	isLoadingBefore = false,
	isLoadingAfter = false,
	onLoadBefore,
	onLoadAfter,
}: {
	checks: PageSpeedGroupedCheck[];
	range: string;
	hasMoreBefore?: boolean;
	hasMoreAfter?: boolean;
	isLoadingBefore?: boolean;
	isLoadingAfter?: boolean;
	onLoadBefore?: () => void;
	onLoadAfter?: () => void;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState<number>(MIN_CONTAINER_WIDTH);
	const prevScrollWidthRef = useRef<number>(0);
	const prevScrollLeftRef = useRef<number>(0);
	const isInitialRenderRef = useRef<boolean>(true);

	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [isScrollable, setIsScrollable] = useState(false);
	const [scrollPosition, setScrollPosition] = useState({
		scrollLeft: 0,
		scrollWidth: 0,
		clientWidth: 0,
	});

	const updateScrollState = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		const { scrollLeft, scrollWidth, clientWidth } = container;
		const scrollable = scrollWidth > clientWidth + 4;
		setIsScrollable(scrollable);
		setCanScrollLeft(scrollLeft > 5);
		setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
		setScrollPosition({ scrollLeft, scrollWidth, clientWidth });
	}, []);

	// Measure outer container width
	useEffect(() => {
		const updateWidth = () => {
			if (scrollContainerRef.current) {
				const clientW = scrollContainerRef.current.clientWidth;
				if (clientW > 0) {
					setContainerWidth(clientW);
					updateScrollState();
				}
			}
		};
		updateWidth();
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) {
					setContainerWidth(entry.contentRect.width);
					updateScrollState();
				}
			}
		});
		if (scrollContainerRef.current) {
			resizeObserver.observe(scrollContainerRef.current);
		}
		return () => resizeObserver.disconnect();
	}, [updateScrollState]);

	// Scroll position adjustment when older items are prepended
	useLayoutEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		if (isInitialRenderRef.current && checks.length > 0) {
			// On initial render, scroll to the latest checks (far right)
			container.scrollLeft = container.scrollHeight
				? container.scrollWidth - container.clientWidth
				: 0;
			isInitialRenderRef.current = false;
			prevScrollWidthRef.current = container.scrollWidth;
			prevScrollLeftRef.current = container.scrollLeft;
			updateScrollState();
			return;
		}

		if (prevScrollWidthRef.current > 0) {
			const widthDiff = container.scrollWidth - prevScrollWidthRef.current;
			if (widthDiff > 0) {
				// We prepended or appended data; adjust scrollLeft to maintain stable viewport
				container.scrollLeft = container.scrollLeft + widthDiff;
			}
		}

		prevScrollWidthRef.current = container.scrollWidth;
		prevScrollLeftRef.current = container.scrollLeft;
		updateScrollState();
	}, [checks, updateScrollState]);

	// Handle scroll triggers for preloading chunks
	const handleScroll = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const { scrollLeft, scrollWidth, clientWidth } = container;
		prevScrollLeftRef.current = scrollLeft;
		updateScrollState();

		// Preload older checks when approaching the left edge
		if (scrollLeft < 150 && hasMoreBefore && !isLoadingBefore && onLoadBefore) {
			onLoadBefore();
		}

		// Preload newer checks when approaching the right edge
		if (
			scrollWidth - (scrollLeft + clientWidth) < 150 &&
			hasMoreAfter &&
			!isLoadingAfter &&
			onLoadAfter
		) {
			onLoadAfter();
		}
	}, [
		hasMoreBefore,
		hasMoreAfter,
		isLoadingBefore,
		isLoadingAfter,
		onLoadBefore,
		onLoadAfter,
		updateScrollState,
	]);

	const chartCalculatedWidth = Math.max(containerWidth, checks.length * POINT_WIDTH);

	// Custom scrollbar calculation: thumb position & width using reactive scrollPosition state
	const effectiveScrollWidth = scrollPosition.scrollWidth || chartCalculatedWidth;
	const effectiveClientWidth = scrollPosition.clientWidth || containerWidth;
	const maxScroll = Math.max(1, effectiveScrollWidth - effectiveClientWidth);

	const scrollThumbWidthPercent = Math.min(
		100,
		Math.max(8, (effectiveClientWidth / effectiveScrollWidth) * 100)
	);
	const scrollThumbLeftPercent =
		(Math.min(scrollPosition.scrollLeft, maxScroll) / maxScroll) *
		(100 - scrollThumbWidthPercent);

	const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const container = scrollContainerRef.current;
		if (!container) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const clickRatio = (e.clientX - rect.left) / rect.width;
		container.scrollTo({
			left: clickRatio * (container.scrollWidth - container.clientWidth),
			behavior: "smooth",
		});
	};

	return (
		<BaseChart
			icon={
				<Icon
					icon={TrendingUp}
					size={20}
				/>
			}
			title={
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ width: "100%" }}
				>
					<Stack
						direction="row"
						alignItems="baseline"
						spacing={SPACING.MD}
					>
						<Typography
							variant="subtitle2"
							fontWeight={fontWeights.medium}
						>
							{t("pages.pageSpeed.charts.scoreHistory.title")}
						</Typography>
						{isScrollable && (
							<Typography
								variant="caption"
								color={theme.palette.text.secondary}
								fontSize={typographyLevels.s}
								sx={{ userSelect: "none" }}
							>
								({t("pages.pageSpeed.charts.scoreHistory.scrollToExplore")})
							</Typography>
						)}
					</Stack>
					{isLoadingBefore && (
						<CircularProgress
							size={16}
							color="inherit"
						/>
					)}
				</Stack>
			}
		>
			<Box sx={{ position: "relative", width: "100%", overflow: "hidden" }}>
				{/* Visual left edge shadow when there is content to scroll to on the left */}
				<Box
					sx={{
						position: "absolute",
						left: 0,
						top: 0,
						bottom: isScrollable ? 24 : 0,
						width: 28,
						background: `linear-gradient(to right, ${theme.palette.background.paper}, transparent)`,
						pointerEvents: "none",
						zIndex: 2,
						opacity: canScrollLeft ? 1 : 0,
						transition: "opacity 0.2s ease-in-out",
					}}
				/>

				{/* Visual right edge shadow when there is content to scroll to on the right */}
				<Box
					sx={{
						position: "absolute",
						right: 0,
						top: 0,
						bottom: isScrollable ? 24 : 0,
						width: 28,
						background: `linear-gradient(to left, ${theme.palette.background.paper}, transparent)`,
						pointerEvents: "none",
						zIndex: 2,
						opacity: canScrollRight ? 1 : 0,
						transition: "opacity 0.2s ease-in-out",
					}}
				/>

				<Box
					ref={scrollContainerRef}
					onScroll={handleScroll}
					sx={{
						width: "100%",
						overflowX: "auto",
						overflowY: "hidden",
						position: "relative",
						scrollbarWidth: "none", // Hide OS native scrollbars entirely
						"&::-webkit-scrollbar": {
							display: "none",
						},
					}}
				>
					<div style={{ width: chartCalculatedWidth, height: 215 }}>
						<AreaChart
							width={chartCalculatedWidth}
							height={215}
							data={checks}
						>
							<XAxis
								dataKey={"bucketDate"}
								tick={(props) => (
									<XTick
										{...props}
										range={range}
									/>
								)}
							/>
							<CartesianGrid
								stroke={theme.palette.divider}
								strokeWidth={1}
								strokeOpacity={1}
								fill="transparent"
								vertical={false}
							/>
							<Tooltip
								cursor={{ stroke: theme.palette.divider }}
								content={<HistogramPageSpeedScoresTooltip config={config} />}
							/>
							<defs>
								{Object.values(config).map(({ id, palette }) => {
									const startColor = theme.palette[palette].main;
									const endColor = theme.palette[palette].light;

									return (
										<linearGradient
											id={id}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
											key={id}
										>
											<stop
												offset="0%"
												stopColor={startColor}
												stopOpacity={0.8}
											/>
											<stop
												offset="100%"
												stopColor={endColor}
												stopOpacity={0}
											/>
										</linearGradient>
									);
								})}
							</defs>
							{Object.keys(config).map((key) => {
								const { palette } = config[key];
								const strokeColor = theme.palette[palette].main;
								const bgColor = theme.palette.primary.main;

								return (
									<Area
										isAnimationActive={false}
										connectNulls
										key={key}
										dataKey={key}
										stackId={1}
										stroke={strokeColor}
										fill={`url(#${config[key].id})`}
										activeDot={{ stroke: bgColor, fill: strokeColor, r: 4.5 }}
									/>
								);
							})}
						</AreaChart>
					</div>
				</Box>

				{/* Permanent custom scrollbar track & thumb (never vanishes!) */}
				{isScrollable && (
					<Box
						onClick={handleTrackClick}
						mt={SPACING.SM}
						sx={{
							mx: "auto",
							width: "98%",
							height: 8,
							backgroundColor: theme.palette.action.hover,
							borderRadius: 4,
							position: "relative",
							cursor: "pointer",
						}}
					>
						<Box
							sx={{
								position: "absolute",
								left: `${scrollThumbLeftPercent}%`,
								width: `${scrollThumbWidthPercent}%`,
								height: "100%",
								backgroundColor: theme.palette.text.disabled,
								borderRadius: 4,
								transition: "background-color 0.2s, left 0.05s ease-out",
								"&:hover": {
									backgroundColor: theme.palette.text.secondary,
								},
							}}
						/>
					</Box>
				)}
			</Box>
		</BaseChart>
	);
};

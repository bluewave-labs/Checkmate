import { useRef, useEffect, useState } from "react";
import { Box, Typography, Stack, useTheme, GlobalStyles } from "@mui/material";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { FlatGeoCheck } from "@/Types/GeoCheck";
import "maplibre-gl/dist/maplibre-gl.css";

interface GeoChecksMapProps {
	geoChecks: FlatGeoCheck[];
}

export const GeoChecksMap = ({ geoChecks }: GeoChecksMapProps) => {
	const mapRef = useRef<MapRef>(null);
	const [selectedCheck, setSelectedCheck] = useState<FlatGeoCheck | null>(null);
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === "dark";

	const mapPopupStyles = (
		<GlobalStyles
			styles={{
				".maplibregl-popup-content": {
					background: "transparent !important",
					padding: "0 !important",
					boxShadow: "none !important",
				},
				".maplibregl-popup-tip": {
					display: "none",
				},
				".maplibregl-ctrl-attrib": {
					display: "none",
				},
				".maplibregl-ctrl-logo": {
					display: "none",
				},
			}}
		/>
	);

	useEffect(() => {
		if (geoChecks.length === 0 || !mapRef.current) return;

		const bounds = geoChecks.reduce(
			(acc, check) => {
				return {
					minLng: Math.min(acc.minLng, check.location.longitude),
					maxLng: Math.max(acc.maxLng, check.location.longitude),
					minLat: Math.min(acc.minLat, check.location.latitude),
					maxLat: Math.max(acc.maxLat, check.location.latitude),
				};
			},
			{
				minLng: Infinity,
				maxLng: -Infinity,
				minLat: Infinity,
				maxLat: -Infinity,
			}
		);

		if (bounds.minLng !== Infinity) {
			mapRef.current.fitBounds(
				[
					[bounds.minLng, bounds.minLat],
					[bounds.maxLng, bounds.maxLat],
				],
				{ padding: 50, duration: 1000 }
			);
		}
	}, [geoChecks]);

	const getMarkerColor = (status: boolean): string => {
		return status ? theme.palette.success.main : theme.palette.error.main;
	};

	const formatResponseTime = (timing: number): string => {
		return `${timing.toFixed(0)}ms`;
	};

	return (
		<>
			{mapPopupStyles}
			<Box
				height={500}
				width={"100%"}
				borderRadius={theme.shape.borderRadius}
				overflow={"hidden"}
			>
				<Map
					ref={mapRef}
					initialViewState={{
						longitude: 0,
						latitude: 20,
						zoom: 1.5,
					}}
					style={{ height: "100%", width: "100%" }}
					mapStyle={
						isDarkMode
							? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
							: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
					}
				>
					{geoChecks.map((check, index) => (
						<Marker
							key={`${check.id}-${index}`}
							longitude={check.location.longitude}
							latitude={check.location.latitude}
							anchor="bottom"
							onClick={(e: any) => {
								e.originalEvent.stopPropagation();
								setSelectedCheck(check);
							}}
						>
							<div
								style={{
									width: "10px",
									height: "10px",
									borderRadius: "50%",
									backgroundColor: getMarkerColor(check.status),
									boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
									cursor: "pointer",
								}}
							/>
						</Marker>
					))}

					{selectedCheck && (
						<Popup
							longitude={selectedCheck.location.longitude}
							latitude={selectedCheck.location.latitude}
							anchor="top"
							onClose={() => setSelectedCheck(null)}
							closeOnClick={false}
						>
							<Box
								sx={{
									minWidth: 200,
									p: theme.spacing(4),
									bgcolor: theme.palette.background.paper,
									borderWidth: 1,
									borderStyle: "solid",
									borderColor: theme.palette.divider,
									borderRadius: 1,
								}}
							>
								<Typography
									variant="subtitle1"
									fontWeight="bold"
									gutterBottom
								>
									{selectedCheck.location.city}, {selectedCheck.location.country}
								</Typography>
								<Stack spacing={0.5}>
									<Typography variant="body2">
										<Typography
											component="span"
											fontWeight="medium"
										>
											Status:
										</Typography>{" "}
										{selectedCheck.status ? "Up" : "Down"}
									</Typography>
									<Typography variant="body2">
										<Typography
											component="span"
											fontWeight="medium"
										>
											Status Code:
										</Typography>{" "}
										{selectedCheck.statusCode}
									</Typography>
									<Typography variant="body2">
										<Typography
											component="span"
											fontWeight="medium"
										>
											Response Time:
										</Typography>{" "}
										{formatResponseTime(selectedCheck.timings.total)}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ mt: 0.5 }}
									>
										{new Date(selectedCheck.createdAt).toLocaleString()}
									</Typography>
								</Stack>
							</Box>
						</Popup>
					)}
				</Map>
			</Box>
		</>
	);
};

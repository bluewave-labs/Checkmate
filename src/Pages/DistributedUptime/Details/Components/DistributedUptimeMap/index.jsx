import "maplibre-gl/dist/maplibre-gl.css";
import PropTypes from "prop-types";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import maplibregl from "maplibre-gl";
import { useSelector } from "react-redux";
import buildStyle from "./buildStyle";

const DistributedUptimeMap = ({ width = "100%", checks }) => {
	const mapContainer = useRef(null);
	const map = useRef(null);
	const theme = useTheme();
	const [mapLoaded, setMapLoaded] = useState(false);
	const mode = useSelector((state) => state.ui.mode);
	const initialTheme = useRef(theme);
	const initialMode = useRef(mode);

	const colorLookup = (avgResponseTime) => {
		if (avgResponseTime <= 150) {
			return "#00FF00"; // Green
		} else if (avgResponseTime <= 250) {
			return "#FFFF00"; // Yellow
		} else {
			return "#FF0000"; // Red
		}
	};

	useEffect(() => {
		if (mapContainer.current && !map.current) {
			const initialStyle = buildStyle(initialTheme.current, initialMode.current);
			map.current = new maplibregl.Map({
				container: mapContainer.current,
				style: initialStyle,
				center: [0, 20],
				zoom: 0.8,
				attributionControl: false,
			});
		}
		map.current.on("load", () => {
			setMapLoaded(true);
		});

		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, []);

	useEffect(() => {
		const style = buildStyle(theme, mode);
		if (map.current && mapLoaded) {
			map.current.setStyle(style);
		}
	}, [theme, mode, mapLoaded]);

	useEffect(() => {
		if (map.current && checks?.length > 0) {
			// Convert dots to GeoJSON
			const geojson = {
				type: "FeatureCollection",
				features: checks.map((check) => {
					return {
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [check.lng, check.lat],
						},
						properties: {
							color: theme.palette.accent.main,
							// color: colorLookup(check.avgResponseTime) || "blue", // Default to blue if no color specified
						},
					};
				}),
			};

			// Update the source with new dots
			const source = map.current.getSource("data-dots");
			if (source) {
				source.setData(geojson);
			}
		}
	}, [checks, theme, mapLoaded]);
	return (
		<div
			ref={mapContainer}
			style={{
				width: width,
			}}
		/>
	);
};

DistributedUptimeMap.propTypes = {
	checks: PropTypes.array,
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default DistributedUptimeMap;

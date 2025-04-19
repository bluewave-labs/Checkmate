import baseStyle from "./DistributedUptimeMapStyle.json";

const buildStyle = (theme, mode) => {
	const style = JSON.parse(JSON.stringify(baseStyle));

	if (mode === "dark") {
		return baseStyle;
	}

	if (style.layers) {
		const newLayers = style.layers.map((layer) => {
			if (layer.id === "background") {
				layer.paint["background-color"] = theme.palette.map.main;
			}

			if (layer.id === "countries-fill") {
				layer.paint["fill-color"] = theme.palette.map.lowContrast;
			}

			if (layer.id === "coastline") {
				layer.paint["line-color"] = theme.palette.map.highContrast;
			}
			if (layer.id === "countries-boundary") {
				layer.paint["line-color"] = theme.palette.map.highContrast;
			}
			return layer;
		});
		style.layers = newLayers;
	}
	return style;
};

export default buildStyle;

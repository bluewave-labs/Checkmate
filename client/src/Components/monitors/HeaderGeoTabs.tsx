import Stack from "@mui/material/Stack";
import { Tabs, Tab } from "@/Components/design-elements";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { GeoContinent } from "@/Types/GeoCheck";

interface HeaderGeoTabsProps {
	geoCheckEnabled: boolean;
	locations: GeoContinent[] | undefined;
	selectedLocation: GeoContinent;
	onLocationChange: (location: GeoContinent) => void;
}

export const HeaderGeoTabs = ({
	geoCheckEnabled,
	locations,
	selectedLocation,
	onLocationChange,
}: HeaderGeoTabsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!geoCheckEnabled || !locations || locations.length === 0) {
		return null;
	}

	const handleChange = (_event: React.SyntheticEvent, newValue: GeoContinent) => {
		onLocationChange(newValue);
	};

	console.log(locations);

	return (
		<Stack
			spacing={{ xs: theme.spacing(8), md: 0 }}
			direction={{ xs: "column", md: "row" }}
			alignItems={"center"}
			justifyContent={"flex-start"}
		>
			<Tabs
				value={selectedLocation}
				onChange={handleChange}
			>
				{locations.map((location) => (
					<Tab
						key={location}
						label={t(
							`pages.createMonitor.form.geoChecks.option.locations.options.${location}`
						)}
						value={location}
					/>
				))}
			</Tabs>
		</Stack>
	);
};

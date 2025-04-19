import { RowContainer } from "../StandardContainer";
import { Stack, Typography } from "@mui/material";
import Image from "../Image";

import { useTheme } from "@mui/material/styles";

const InfoBox = ({
	img,
	icon: Icon,
	alt,
	heading,
	headingLevel = 2,
	subHeading,
	subHeadingLevel = "",
	sx,
}) => {
	const theme = useTheme();
	return (
		<RowContainer sx={{ ...sx }}>
			{img && (
				<Image
					src={img}
					height={"30px"}
					width={"30px"}
					alt={alt}
					sx={{ marginRight: theme.spacing(8) }}
				/>
			)}
			{Icon && (
				<Icon sx={{ width: "30px", height: "30px", marginRight: theme.spacing(8) }} />
			)}
			<Stack>
				<Typography variant={`h${headingLevel}`}>{heading}</Typography>
				<Typography variant={subHeadingLevel ? `h${subHeadingLevel}` : "body1"}>
					{subHeading}
				</Typography>
			</Stack>
		</RowContainer>
	);
};

export default InfoBox;

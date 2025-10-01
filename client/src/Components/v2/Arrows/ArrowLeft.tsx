import LeftArrow from "@/assets/icons/left-arrow.svg?react";
import LeftArrowDouble from "@/assets/icons/left-arrow-double.svg?react";
import LeftArrowLong from "@/assets/icons/left-arrow-long.svg?react";

export const ArrowLeft = ({
	type,
	color = "#667085",
	...props
}: {
	type?: string;
	color?: string | undefined;
	[key: string]: any;
}) => {
	if (type === "double") {
		return (
			<LeftArrowDouble
				style={{ color }}
				{...props}
			/>
		);
	} else if (type === "long") {
		return (
			<LeftArrowLong
				style={{ color }}
				{...props}
			/>
		);
	} else {
		return (
			<LeftArrow
				style={{ color }}
				{...props}
			/>
		);
	}
};
